import { OrderState, Prisma, PrismaClient } from "@prisma/client";
import { inject, injectable } from "inversify";

import {
  Cache,
  InvalidateCacheByKeys,
  InvalidateCacheByPrefix,
} from "../../decorators/Cache";

import {
  Allergies,
  OrderCreateDTO,
  OrderFullSingleDTO,
  OrderSearchCriteria,
  OrderSearchListResult,
  OrderUpdateProps,
} from "@servemate/dto";
import { OrderMetaDTO } from "@servemate/dto/src";
import "reflect-metadata";
import { HTTPError } from "../../errors/http-error.class";
import { TYPES } from "../../types";
import { WebSocketService } from "../webSocket/websocket.service";
import { AbstractOrderService, ORDER_INCLUDE } from "./abstract-order.service";

@injectable()
export class OrdersService extends AbstractOrderService {
  protected serviceName = "OrdersService";

  constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient, @inject(TYPES.WebSocketService) private wsService: WebSocketService) {
    super(prisma);
    this.prisma = prisma;
  }

  
  /**
   * Builds a Prisma where clause for filtering orders based on search criteria.
   *
   * @param criteria - The order search criteria containing filters such as server name,
   *                   table numbers, date range, amount range, and pagination options.
   *
   * @returns A Prisma OrderWhereInput object that can be used in database queries to filter orders.
   *          Supports filtering by:
   *          - Total amount (min and max range)
   *          - Table numbers (multiple values)
   *          - Order time (date range with inclusive bounds)
   *          - Server name (case-insensitive partial match)
   *
   * @private
   */
  private buildOrderWhereClause(criteria: OrderSearchCriteria): Prisma.OrderWhereInput {
    const { serverName, tableNumbers, dateFrom, dateTo, minAmount, maxAmount, allergies, status } = criteria;

    const filters: Prisma.OrderWhereInput[] = [];

    // Добавляем только фильтры, которые есть в критериях
    if (minAmount || maxAmount) {
      filters.push({ totalAmount: this.buildRangeWhere(minAmount, maxAmount) });
    }

    if (tableNumbers?.length) {
      filters.push({ tableNumber: { in: tableNumbers } });
    }

    if (dateFrom || dateTo) {
      filters.push({
        orderTime: {
          ...(dateFrom && { gte: dateFrom }),
          ...(dateTo && { lte: dateTo }),
        },
      });
    }

    if (serverName) {
      filters.push({
        server: {
          name: {
            contains: serverName,
            mode: "insensitive" as const,
          },
        },
      });
    }

    if(status) {
      filters.push({ status });
    }

    // Аллергии обрабатываем отдельно  
    if (allergies?.length) {
      filters.push({
        OR: [
          {
            foodItems: {
              some: {
                allergies: {
                  some: {
                    allergy: { in: allergies },
                  },
                },
              },
            },
          },
          {
            drinkItems: {
              some: {
                allergies: {
                  some: {
                    allergy: { in: allergies },
                  },
                },
              },
            },
          },
        ],
      });
    }

    // Возвращаем результат
    if (filters.length === 0) {
      return {};
    }
    if (filters.length === 1) {
      return filters[0];
    }
    return { AND: filters };
  }

  @Cache(60)
  async findOrders(
    criteria: OrderSearchCriteria,
  ): Promise<OrderSearchListResult> {
    try {
      const { page, pageSize, sortBy, sortOrder } = criteria;
      console.log('criteria:', criteria);
      
      // Используем buildOrderWhereClause для всех фильтров, включая аллергии
      const where = this.buildOrderWhereClause(criteria);
     
      const [orders, total, priceStats] = await Promise.all([
        this.prisma.order.findMany({
          where,
          select: {
            id: true,
            status: true,
            server: {
              select: { name: true, id: true },
            },
            tableNumber: true,
            guestsCount: true,
            orderTime: true,
            completionTime: true,
            updatedAt: true,
            comments: true,
            totalAmount: true,
            discount: true,
            tip: true,
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: {
            [sortBy]: sortOrder,
          },
        }),
        this.prisma.order.count({
          where,
        }),
        this.prisma.order.aggregate({
          where,
          _min: {
            totalAmount: true,
            orderTime: true,
          },
          _max: {
            totalAmount: true,
            orderTime: true,
          },
        }),
      ]);

      return {
        orders: orders.map((order) => ({
          ...order,
          status: order.status as OrderState,
        })),
        priceRange: {
          min: Math.floor(priceStats._min.totalAmount ?? 0),
          max: Math.ceil(priceStats._max.totalAmount ?? 0),
        },
        dateRange: {
          min: priceStats._min.orderTime?.toISOString() ?? new Date().toISOString(),
          max: priceStats._max.orderTime?.toISOString() ?? new Date().toISOString(),
        },
        totalCount: total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Finds an order by its ID and returns the full order details.
   *
   * @param {number} orderId - The ID of the order to find.
   * @returns {Promise<OrderFullSingleDTO>} A promise that resolves to the full order details.
   * @throws Will throw an error if the order is not found or if there is an issue with the database query.
   */
  @Cache(60)
  async findOrderById(orderId: number): Promise<OrderFullSingleDTO> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: ORDER_INCLUDE,
      });

      if (!order) {
        throw new HTTPError(
          404,
          this.serviceName,
          "Order not found in the database",
          `/orders/${orderId}`,
        );
      }

      return {
        ...order,
        foodItems: this.groupItems(order.foodItems),
        drinkItems: this.groupItems(order.drinkItems),
       
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // @Cache(100)
  /**
   * Retrieves metadata related to orders, including maximum guests, price range, date range,
   * available table numbers, possible order statuses, and allergies.
   *
   * @returns {Promise<OrderMetaDTO>} A promise that resolves to an object containing order metadata:
   *  - `statuses`: Array of possible order states.
   *  - `allergies`: Array of possible allergies.
   *  - `maxGuests`: Maximum number of guests found in any order.
   *  - `prices`: Object with `min` and `max` total order amounts.
   *  - `dates`: Object with `min` and `max` order times in ISO string format.
   *  - `tableNumbers`: Array of distinct table numbers from all orders.
   *
   * @throws Will throw an error if the metadata retrieval fails.
   */
  async getOrderMeta(criteria: OrderSearchCriteria): Promise<OrderMetaDTO> {
    try {
      const where = this.buildOrderWhereClause(criteria);

      const [
        unfilteredAggregation,
        filteredAggregation,
        unfilteredTableNumbers,
        filteredTableNumbers,
      ] = await this.prisma.$transaction([
        this.prisma.order.aggregate({
          _max: {
            guestsCount: true,
            totalAmount: true,
            orderTime: true,
          },
          _min: {
            totalAmount: true,
            orderTime: true,
          },
        }),
        this.prisma.order.aggregate({
          where,
          _max: {
            guestsCount: true,
            totalAmount: true,
            orderTime: true,
          },
          _min: {
            totalAmount: true,
            orderTime: true,
          },
        }),
        this.prisma.order.findMany({
          select: {
            tableNumber: true,
          },
          distinct: ["tableNumber"],
        }),
        this.prisma.order.findMany({
          where,
          select: {
            tableNumber: true,
          },
          distinct: ["tableNumber"],
        }),
      ]);

      

      return {
        statuses: Object.values(OrderState),
        allergies: Object.values(Allergies),
        maxGuests: unfilteredAggregation._max.guestsCount ?? 0,
        prices: {
          min: Math.floor(unfilteredAggregation._min.totalAmount ?? 0),
          max: Math.ceil(unfilteredAggregation._max.totalAmount ?? 0),
        },
        dates: {
          min:
            unfilteredAggregation._min.orderTime?.toISOString() ??
            new Date().toISOString(),
          max:
            unfilteredAggregation._max.orderTime?.toISOString() ??
            new Date().toISOString(),
        },
        tableNumbers: unfilteredTableNumbers.map((table) => table.tableNumber),
        filtered: {
          maxGuests: filteredAggregation._max.guestsCount ?? 0,
          prices: {
            min: Math.floor(filteredAggregation._min.totalAmount ?? 0),
            max: Math.ceil(filteredAggregation._max.totalAmount ?? 0),
          },
          dates: {
            min:
              filteredAggregation._min.orderTime?.toISOString() ??
              new Date().toISOString(),
            max:
              filteredAggregation._max.orderTime?.toISOString() ??
              new Date().toISOString(),
          },
          tableNumbers: filteredTableNumbers.map((table) => table.tableNumber),
        },
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Creates a new order in the system.
   *
   * This function performs the following steps:
   * 1. Validates and corrects the prices of food and drink items.
   * 2. Calculates the total amount of the order.
   * 3. Flattens the food and drink items for database operations.
   * 4. Creates the order in the database.
   *
   * @param {OrderCreateDTO} order - The order data transfer object containing all necessary information to create an order.
   *                                 This includes food items, drink items, and other order details.
   *
   * @returns {Promise<OrderFullSingleDTO>} A promise that resolves to the newly created order,
   *                                        including all details and the assigned order ID.
   *
   * @throws {Error} If there's any issue during the order creation process, an error is thrown and handled.
   */
  @InvalidateCacheByPrefix(`findOrders_`)
  @InvalidateCacheByPrefix(`getOrderMeta_`)
  async createOrder(order: OrderCreateDTO): Promise<OrderFullSingleDTO> {
    try {
      const { mergedItems, totalAmount } = await this.prepareOrderItems(order);

      return await this.createOrderInDatabase({
        ...order,
        flattenedFoodItems: mergedItems.foodItems,
        flattenedDrinkItems: mergedItems.drinkItems,
        totalAmount,
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Deletes an order and all its associated food and drink items from the database.
   *
   * @param {number} orderId - The ID of the order to be deleted.
   * @throws Will throw an error if the deletion fails.
   */
  @InvalidateCacheByPrefix(`findOrders_`)
  @InvalidateCacheByPrefix(`getOrderMeta_`)
  @InvalidateCacheByKeys((orderId) => [`findOrderById_[${orderId}]`])
  async delete(orderId: number): Promise<void> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        const existingOrder = await prisma.order.findUnique({
          where: { id: orderId },
          select: {
            id: true,
            payments: { select: { id: true } },
            foodItems: { 
              select: { 
                id: true, 
                printed: true, 
                fired: true, 
                paymentStatus: true 
              } 
            },
            drinkItems: { 
              select: { 
                id: true, 
                printed: true, 
                fired: true, 
                paymentStatus: true 
              } 
            },
          },
        });

        if (!existingOrder) {
          throw new HTTPError(
            404,
            this.serviceName,
            "Order not found",
            `/orders/${orderId}`,
          );
        }

        if (existingOrder.payments.length > 0) {
          throw new HTTPError(
            400,
            this.serviceName,
            "Cannot delete order with associated payments",
            `/orders/${orderId}`,
          );
        }

        const allItems = [...existingOrder.foodItems, ...existingOrder.drinkItems];

        if (allItems.some((item) => item.printed)) {
          throw new HTTPError(
            400,
            this.serviceName,
            "Cannot delete order with printed items",
            `/orders/${orderId}`,
          );
        }

        if (allItems.some((item) => item.fired)) {
          throw new HTTPError(
            400,
            this.serviceName,
            "Cannot delete order with fired/called items",
            `/orders/${orderId}`,
          );
        }

        if (allItems.some((item) => item.paymentStatus !== "NONE")) {
          throw new HTTPError(
            400,
            this.serviceName,
            "Cannot delete order with items that have payment status",
            `/orders/${orderId}`,
          );
        }

        await prisma.orderFoodItem.deleteMany({ where: { orderId } });
        await prisma.orderDrinkItem.deleteMany({ where: { orderId } });
        await prisma.order.delete({ where: { id: orderId } });
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Prints the order items with the given IDs.
   *
   * This method checks if any of the specified order items have already been printed.
   * If any items have been printed, it throws an HTTPError with a message indicating
   * which items have already been printed. If no items have been printed, it updates
   * the `printed` status of the specified order items to `true`.
   *
   * @param {number} orderId - The ID of the order.
   * @param {number[]} ids - An array of order item IDs to be printed.
   * @returns {Promise<string>} A promise that resolves to a string indicating the items have been printed.
   * @throws {HTTPError} If any of the specified items have already been printed.
   */
  @InvalidateCacheByKeys((orderId: number) => [`findOrderById_[${orderId}]`])
  async printOrderItems(orderId: number, ids: number[]): Promise<string> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const [drinkItems, foodItems] = await Promise.all([
          prisma.orderDrinkItem.findMany({
            where: { id: { in: ids } },
            select: { id: true, printed: true },
          }),
          prisma.orderFoodItem.findMany({
            where: { id: { in: ids } },
            select: { id: true, printed: true },
          }),
        ]);

        const allItems = [...drinkItems, ...foodItems];
        const printedItems = allItems.filter((item) => item.printed);

        if (printedItems.length > 0) {
          throw new HTTPError(
            400,
            this.serviceName,
            "Items have already been printed",
          );
        }

        await Promise.all([
          prisma.orderFoodItem.updateMany({
            where: { id: { in: ids } },
            data: { printed: true },
          }),
          prisma.orderDrinkItem.updateMany({
            where: { id: { in: ids } },
            data: { printed: true },
          }),
        ]);

        return `Items have been printed`;
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Calls the order items by marking them as fired.
   *
   * @param {number} orderId - The ID of the order.
   * @param {number[]} ids - The IDs of the order items to be called.
   * @returns {Promise<string>} A promise that resolves to a message indicating the items have been called.
   * @throws {HTTPError} If any of the items have not been printed or have already been fired.
   */
  @InvalidateCacheByKeys((orderId: number) => [`findOrderById_[${orderId}]`])
  async callOrderItems(orderId: number, ids: number[]): Promise<string> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const existingOrder = await prisma.order.findUnique({
          where: { id: orderId },
          select: { id: true },
        });

        if (!existingOrder) {
          throw new HTTPError(
            404,
            this.serviceName,
            `Order with ID ${orderId} not found in the database`,
            `/orders/${orderId}`,
          );
        }

        const [foodItems, drinkItems] = await Promise.all([
          prisma.orderFoodItem.findMany({
            where: { id: { in: ids } },
            select: { id: true, printed: true, fired: true },
          }),
          prisma.orderDrinkItem.findMany({
            where: { id: { in: ids } },
            select: { id: true, printed: true, fired: true },
          }),
        ]);

        const allItems = [...foodItems, ...drinkItems];
        const notPrintedItems = allItems.filter((item) => !item.printed);
        const firedItems = allItems.filter((item) => item.fired);

        if (notPrintedItems.length > 0) {
          throw new HTTPError(
            400,
            this.serviceName,
            `Items ${notPrintedItems.map((item) => item.id).join(", ")} have not been printed`,
          );
        }

        if (firedItems.length > 0) {
          throw new HTTPError(
            400,
            this.serviceName,
            `Items ${firedItems.map((item) => item.id).join(", ")} have already been fired`,
          );
        }

        await Promise.all([
          prisma.orderFoodItem.updateMany({
            where: { id: { in: ids } },
            data: { fired: true },
          }),
          prisma.orderDrinkItem.updateMany({
            where: { id: { in: ids } },
            data: { fired: true },
          }),
        ]);

        return `Items ${ids.join(", ")} have been called`;
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Updates the order items in the database for a given order ID.
   *
   * @param {number} orderId - The ID of the order to update.
   * @param {Object} updatedData - The updated data for the order.
   * @param {Prisma.OrderFoodItemCreateManyOrderInput[]} updatedData.foodItems - The updated food items for the order.
   * @param {Prisma.OrderDrinkItemCreateManyOrderInput[]} updatedData.drinkItems - The updated drink items for the order.
   * @param {number} updatedData.totalAmount - The updated total amount for the order.
   * @returns {Promise<Prisma.Order>} The updated order with included server, food items, and drink items.
   */
  @InvalidateCacheByKeys((orderId) => [`findOrderById_[${orderId}]`])
  async updateOrderItemsInDatabase(
    orderId: number,
    updatedData: {
      foodItems: Prisma.OrderFoodItemCreateManyOrderInput[];
      drinkItems: Prisma.OrderDrinkItemCreateManyOrderInput[];
      totalAmount: number;
    },
  ) {
    try {
      const { foodItems, drinkItems, totalAmount } = updatedData;
      return await this.prisma.order.update({
        where: { id: orderId },
        data: {
          totalAmount,
          foodItems: {
            deleteMany: {},
            createMany: {
              data: foodItems,
            },
          },
          drinkItems: {
            deleteMany: {},
            createMany: {
              data: drinkItems,
            },
          },
        },
        include: ORDER_INCLUDE,
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Updates the food and drink items in an existing order.
   *
   * This method performs the following steps:
   * 1. Finds the existing order by its ID.
   * 2. Prepares the new order items by merging them with the existing items.
   * 3. Updates the order items in the database within a transaction.
   * 4. Returns the formatted updated order.
   *
   * @param orderId - The ID of the order to update.
   * @param updatedData - An object containing the updated food and drink items.
   * @returns A promise that resolves to the updated order.
   * @throws {HTTPError} If the order is not found in the database.
   * @throws {Error} If there is an issue during the update process.
   */
  @InvalidateCacheByKeys((orderId) => [`findOrderById_[${orderId}]`])
  async updateItemsInOrder(
    orderId: number,
    updatedData: Pick<OrderCreateDTO, "foodItems" | "drinkItems">
  ): Promise<OrderFullSingleDTO> {
    try {
      const existingOrder = await this.findOrderById(orderId);

      const { mergedItems, totalAmount } = await this.prepareOrderItems(
        existingOrder,
        updatedData,
      );

      const formattedNewOrder: {
        foodItems: Prisma.OrderFoodItemCreateManyOrderInput[];
        drinkItems: Prisma.OrderDrinkItemCreateManyOrderInput[];
        totalAmount: number;
      } = {
        foodItems: mergedItems.foodItems,
        drinkItems: mergedItems.drinkItems,
        totalAmount,
      };

      const updatedOrder = await this.updateOrderItemsInDatabase(
        orderId,
        formattedNewOrder,
      );

      return this.formatOrder(updatedOrder);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Updates the properties of an existing order.
   *
   * @param orderId - The ID of the order to update.
   * @param updatedProperties - An object containing the properties to update.
   * @returns A promise that resolves to the updated order details.
   * @throws {HTTPError} If the order is not found in the database.
   * @throws {Error} If there is an error during the update process.
   */
  @InvalidateCacheByKeys((orderId) => [`findOrderById_[${orderId}]`])
  async updateOrderProperties(
    orderId: number,
    updatedProperties: OrderUpdateProps,
  ): Promise<OrderFullSingleDTO> {
    try {
      const isCompleted =
        updatedProperties?.status === "COMPLETED" ||
        updatedProperties?.status === "DISPUTED"
          ? new Date()
          : null;

      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          ...updatedProperties,
          completionTime: isCompleted,
        },
        include: ORDER_INCLUDE,
      });

      return this.formatOrder(updatedOrder);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
