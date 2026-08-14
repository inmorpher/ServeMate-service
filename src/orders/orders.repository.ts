import {
  Allergy,
  OrderState,
  PaymentState,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { HTTPError } from '../errors/http-error.class';
import { TYPES } from '../types';
import {
  OrderMetaDto,
  OrderQuery,
  OrderResponseDto,
  OrderSearchResultDto,
  OrderUpdate,
} from './dto';
import {
  IOrdersRepository,
  OrderCreateData,
  OrderItemsUpdateData,
} from './orders.repository.interface';

const ORDER_DETAILS_INCLUDE = {
  server: {
    select: {
      id: true,
      name: true,
    },
  },
  foodItems: {
    include: {
      foodItem: {
        select: {
          id: true,
          name: true,
        },
      },
      allergies: {
        select: {
          allergy: true,
        },
      },
    },
    orderBy: [{ guestNumber: 'asc' }, { foodItem: { name: 'asc' } }],
  },
  drinkItems: {
    include: {
      drinkItem: {
        select: {
          id: true,
          name: true,
        },
      },
      allergies: {
        select: {
          allergy: true,
        },
      },
    },
    orderBy: [{ guestNumber: 'asc' }, { drinkItem: { name: 'asc' } }],
  },
} satisfies Prisma.OrderInclude;

type OrderWithDetails = Prisma.OrderGetPayload<{
  include: typeof ORDER_DETAILS_INCLUDE;
}>;

@injectable()
export class OrdersRepository implements IOrdersRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  async findOrders(criteria: OrderQuery): Promise<OrderSearchResultDto> {
    const where = this.buildWhere(criteria);

    const orderBy = {
      [criteria.sortBy]: criteria.sortOrder,
    } as Prisma.OrderOrderByWithRelationInput;

    const [orders, total, priceStats] = await Promise.all([
      this.prisma.order.findMany({
        where,
        select: {
          id: true,
          status: true,
          server: {
            select: {
              id: true,
              name: true,
            },
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
        skip: (criteria.page - 1) * criteria.pageSize,
        take: criteria.pageSize,
        orderBy,
      }),

      this.prisma.order.count({ where }),

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
      orders: orders.map(order => ({
        ...order,
        status: order.status as OrderState,
      })),
      priceRange: {
        min: Math.floor(priceStats._min.totalAmount ?? 0),
        max: Math.ceil(priceStats._max.totalAmount ?? 0),
      },
      dateRange: {
        min:
          priceStats._min.orderTime?.toISOString() ?? new Date().toISOString(),
        max:
          priceStats._max.orderTime?.toISOString() ?? new Date().toISOString(),
      },
      totalCount: total,
      page: criteria.page,
      pageSize: criteria.pageSize,
      totalPages: Math.ceil(total / criteria.pageSize),
    };
  }

  async findById(orderId: number): Promise<OrderResponseDto | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_DETAILS_INCLUDE,
    });

    if (!order) {
      return null;
    }
    return this.toResponse(order);
  }

  async getMeta(criteria: OrderQuery): Promise<OrderMetaDto> {
    const where = this.buildWhere(criteria);

    const [
      allAggregation,
      filteredAggregation,
      allTableNumbers,
      filteredTableNumbers,
    ] = await this.prisma.$transaction([
      this.prisma.order.aggregate({
        _min: {
          totalAmount: true,
          orderTime: true,
          guestsCount: true,
        },
        _max: {
          totalAmount: true,
          orderTime: true,
          guestsCount: true,
        },
      }),
      this.prisma.order.aggregate({
        where,
        _min: {
          totalAmount: true,
          orderTime: true,
          guestsCount: true,
        },
        _max: {
          totalAmount: true,
          orderTime: true,
          guestsCount: true,
        },
      }),
      this.prisma.order.findMany({
        select: {
          tableNumber: true,
        },
        distinct: ['tableNumber'],
        orderBy: {
          tableNumber: 'asc',
        },
      }),

      this.prisma.order.findMany({
        where,
        select: {
          tableNumber: true,
        },
        distinct: ['tableNumber'],
        orderBy: {
          tableNumber: 'asc',
        },
      }),
    ]);

    const fallbackDate = new Date().toISOString();

    return {
      statuses: Object.values(OrderState),
      allergies: Object.values(Allergy),

      maxGuests: allAggregation._max.guestsCount ?? 0,

      prices: {
        min: Math.floor(allAggregation._min.totalAmount ?? 0),
        max: Math.ceil(allAggregation._max.totalAmount ?? 0),
      },

      dates: {
        min: allAggregation._min.orderTime?.toISOString() ?? fallbackDate,
        max: allAggregation._max.orderTime?.toISOString() ?? fallbackDate,
      },

      tableNumbers: allTableNumbers.map(item => item.tableNumber),

      filtered: {
        maxGuests: filteredAggregation._max.guestsCount ?? 0,

        prices: {
          min: Math.floor(filteredAggregation._min.totalAmount ?? 0),
          max: Math.ceil(filteredAggregation._max.totalAmount ?? 0),
        },

        dates: {
          min:
            filteredAggregation._min.orderTime?.toISOString() ?? fallbackDate,
          max:
            filteredAggregation._max.orderTime?.toISOString() ?? fallbackDate,
        },

        tableNumbers: filteredTableNumbers.map(item => item.tableNumber),
      },
    };
  }

  async create(data: OrderCreateData): Promise<OrderResponseDto> {
    const order = await this.prisma.order.create({
      data: {
        server: {
          connect: {
            id: data.serverId,
          },
        },
        table: {
          connect: {
            tableNumber: data.tableNumber,
          },
        },
        guestsCount: data.guestsCount,
        status: data.status,
        comments: data.comments ?? null,
        discount: data.discount,
        totalAmount: data.totalAmount,

        foodItems: {
          create: data.foodItems.map(item => ({
            guestNumber: item.guestNumber,
            itemId: item.itemId,
            price: item.price,
            discount: item.discount,
            finalPrice: item.finalPrice,
            specialRequest: item.specialRequest,
            allergies: {
              create: item.allergies.map(allergy => ({
                allergy,
              })),
            },
          })),
        },

        drinkItems: {
          create: data.drinkItems.map(item => ({
            guestNumber: item.guestNumber,
            itemId: item.itemId,
            price: item.price,
            discount: item.discount,
            finalPrice: item.finalPrice,
            specialRequest: item.specialRequest,
            allergies: {
              create: item.allergies.map(allergy => ({
                allergy,
              })),
            },
          })),
        },
      },
      include: ORDER_DETAILS_INCLUDE,
    });

    return this.toResponse(order);
  }
  async update(orderId: number, data: OrderUpdate): Promise<OrderResponseDto> {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        ...(data.tableNumber !== undefined && {
          table: {
            connect: { tableNumber: data.tableNumber },
          },
        }),
        ...(data.guestsCount !== undefined && {
          guestsCount: data.guestsCount,
        }),
        ...(data.status !== undefined && { status: data.status }),
        ...((data.status === OrderState.COMPLETED ||
          data.status === OrderState.DISPUTED) && {
          completionTime: new Date(),
        }),
        ...(data.comments !== undefined && { comments: data.comments }),
        ...(data.discount !== undefined && { discount: data.discount }),
        ...(data.tip !== undefined && { tip: data.tip }),
      },
      include: ORDER_DETAILS_INCLUDE,
    });

    return this.toResponse(order);
  }

  async updateItems(
    orderId: number,
    data: OrderItemsUpdateData
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        totalAmount: data.totalAmount,
        foodItems: {
          deleteMany: {},
          create: data.foodItems.map(item => ({
            guestNumber: item.guestNumber,
            itemId: item.itemId,
            price: item.price,
            discount: item.discount,
            finalPrice: item.finalPrice,
            specialRequest: item.specialRequest,
            printed: item.printed,
            fired: item.fired,
            paymentStatus: item.paymentStatus,
            allergies: {
              create: item.allergies.map(allergy => ({ allergy })),
            },
          })),
        },
        drinkItems: {
          deleteMany: {},
          create: data.drinkItems.map(item => ({
            guestNumber: item.guestNumber,
            itemId: item.itemId,
            price: item.price,
            discount: item.discount,
            finalPrice: item.finalPrice,
            specialRequest: item.specialRequest,
            printed: item.printed,
            fired: item.fired,
            paymentStatus: item.paymentStatus,
            allergies: {
              create: item.allergies.map(allergy => ({ allergy })),
            },
          })),
        },
      },
      include: ORDER_DETAILS_INCLUDE,
    });

    return this.toResponse(order);
  }

  async printItems(orderId: number, ids: number[]): Promise<void> {
    await this.prisma.$transaction(async transaction => {
      const [foodItems, drinkItems] = await Promise.all([
        transaction.orderFoodItem.findMany({
          where: { orderId, id: { in: ids } },
          select: { id: true, printed: true },
        }),
        transaction.orderDrinkItem.findMany({
          where: { orderId, id: { in: ids } },
          select: { id: true, printed: true },
        }),
      ]);
      const items = [...foodItems, ...drinkItems];

      if (items.length !== ids.length) {
        throw new HTTPError(404, 'OrdersRepository', 'Order items not found');
      }
      if (items.some(item => item.printed)) {
        throw new HTTPError(
          400,
          'OrdersRepository',
          'Items have already been printed'
        );
      }

      await Promise.all([
        transaction.orderFoodItem.updateMany({
          where: { orderId, id: { in: ids } },
          data: { printed: true },
        }),
        transaction.orderDrinkItem.updateMany({
          where: { orderId, id: { in: ids } },
          data: { printed: true },
        }),
      ]);
    });
  }

  async callItems(orderId: number, ids: number[]): Promise<void> {
    await this.prisma.$transaction(async transaction => {
      const [foodItems, drinkItems] = await Promise.all([
        transaction.orderFoodItem.findMany({
          where: { orderId, id: { in: ids } },
          select: { id: true, printed: true, fired: true },
        }),
        transaction.orderDrinkItem.findMany({
          where: { orderId, id: { in: ids } },
          select: { id: true, printed: true, fired: true },
        }),
      ]);
      const items = [...foodItems, ...drinkItems];

      if (items.length !== ids.length) {
        throw new HTTPError(404, 'OrdersRepository', 'Order items not found');
      }
      const notPrinted = items.filter(item => !item.printed);
      if (notPrinted.length > 0) {
        throw new HTTPError(
          400,
          'OrdersRepository',
          `Items ${notPrinted.map(item => item.id).join(', ')} have not been printed`
        );
      }
      const fired = items.filter(item => item.fired);
      if (fired.length > 0) {
        throw new HTTPError(
          400,
          'OrdersRepository',
          `Items ${fired.map(item => item.id).join(', ')} have already been fired`
        );
      }

      await Promise.all([
        transaction.orderFoodItem.updateMany({
          where: { orderId, id: { in: ids } },
          data: { fired: true },
        }),
        transaction.orderDrinkItem.updateMany({
          where: { orderId, id: { in: ids } },
          data: { fired: true },
        }),
      ]);
    });
  }

  async delete(orderId: number): Promise<void> {
    await this.prisma.$transaction(async transaction => {
      const order = await transaction.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          payments: {
            select: { id: true },
          },
          foodItems: {
            select: {
              printed: true,
              fired: true,
              paymentStatus: true,
            },
          },
          drinkItems: {
            select: {
              printed: true,
              fired: true,
              paymentStatus: true,
            },
          },
        },
      });

      if (!order) {
        throw new HTTPError(
          404,
          'OrdersRepository',
          'Order not found',
          `/orders/${orderId}`
        );
      }

      if (order.payments.length > 0) {
        throw new HTTPError(
          400,
          'OrdersRepository',
          'Cannot delete order with associated payments',
          `/orders/${orderId}`
        );
      }

      const items = [...order.foodItems, ...order.drinkItems];

      if (items.some(item => item.printed)) {
        throw new HTTPError(
          400,
          'OrdersRepository',
          'Cannot delete order with printed items',
          `/orders/${orderId}`
        );
      }

      if (items.some(item => item.fired)) {
        throw new HTTPError(
          400,
          'OrdersRepository',
          'Cannot delete order with fired/called items',
          `/orders/${orderId}`
        );
      }

      if (items.some(item => item.paymentStatus !== 'NONE')) {
        throw new HTTPError(
          400,
          'OrdersRepository',
          'Cannot delete order with items that have payment status',
          `/orders/${orderId}`
        );
      }

      await transaction.orderFoodItem.deleteMany({
        where: { orderId },
      });

      await transaction.orderDrinkItem.deleteMany({
        where: { orderId },
      });

      await transaction.order.delete({
        where: { id: orderId },
      });
    });
  }

  private buildWhere(criteria: OrderQuery): Prisma.OrderWhereInput {
    const filters: Prisma.OrderWhereInput[] = [];

    if (criteria.id !== undefined) {
      filters.push({ id: criteria.id });
    }

    if (criteria.tableNumbers?.length) {
      filters.push({
        tableNumber: { in: criteria.tableNumbers },
      });
    }

    if (criteria.tableNumber !== undefined) {
      filters.push({
        tableNumber: criteria.tableNumber,
      });
    }

    if (criteria.guestsCount !== undefined) {
      filters.push({
        guestsCount: criteria.guestsCount,
      });
    }

    if (criteria.serverId !== undefined) {
      filters.push({
        serverId: criteria.serverId,
      });
    }

    if (criteria.serverName !== undefined) {
      filters.push({
        server: {
          name: {
            contains: criteria.serverName,
            mode: 'insensitive',
          },
        },
      });
    }

    if (criteria.status) {
      filters.push({
        status: criteria.status,
      });
    }

    if (criteria.minAmount !== undefined || criteria.maxAmount !== undefined) {
      filters.push({
        totalAmount: {
          ...(criteria.minAmount !== undefined && { gte: criteria.minAmount }),
          ...(criteria.maxAmount !== undefined && { lte: criteria.maxAmount }),
        },
      });
    }

    if (criteria.dateFrom || criteria.dateTo) {
      filters.push({
        orderTime: {
          ...(criteria.dateFrom && { gte: criteria.dateFrom }),
          ...(criteria.dateTo && { lte: criteria.dateTo }),
        },
      });
    }

    if (criteria.allergies?.length) {
      filters.push({
        OR: [
          {
            foodItems: {
              some: {
                allergies: {
                  some: { allergy: { in: criteria.allergies } },
                },
              },
            },
          },
          {
            drinkItems: {
              some: {
                allergies: {
                  some: { allergy: { in: criteria.allergies } },
                },
              },
            },
          },
        ],
      });
    }

    return filters.length === 0
      ? {}
      : filters.length === 1
        ? filters[0]
        : { AND: filters };
  }

  private toResponse(order: OrderWithDetails): OrderResponseDto {
    return {
      id: order.id,
      tableNumber: order.tableNumber,
      guestsCount: order.guestsCount,
      orderTime: order.orderTime,
      updatedAt: order.updatedAt,
      serverId: order.serverId,
      status: order.status,
      comments: order.comments,
      completionTime: order.completionTime,
      totalAmount: order.totalAmount,
      discount: order.discount,
      tip: order.tip,
      shiftId: order.shiftId,
      allergies: [],

      server: order.server,

      foodItems: this.groupItems(
        order.foodItems.map(item => ({
          id: item.id,
          itemId: item.itemId,
          guestNumber: item.guestNumber,
          price: item.price,
          discount: item.discount,
          finalPrice: item.finalPrice,
          printed: item.printed,
          fired: item.fired,
          paymentStatus: item.paymentStatus,
          allergies: item.allergies.map(item => item.allergy),
          name: item.foodItem.name,
          specialRequest: item.specialRequest,
        }))
      ),

      drinkItems: this.groupItems(
        order.drinkItems.map(item => ({
          id: item.id,
          itemId: item.itemId,
          guestNumber: item.guestNumber,
          price: item.price,
          discount: item.discount,
          finalPrice: item.finalPrice,
          printed: item.printed,
          fired: item.fired,
          paymentStatus: item.paymentStatus,
          allergies: item.allergies.map(item => item.allergy),
          name: item.drinkItem.name,
          specialRequest: item.specialRequest,
        }))
      ),
    };
  }

  private groupItems(
    items: Array<{
      id: number;
      itemId: number;
      guestNumber: number;
      price: number;
      discount: number;
      finalPrice: number;
      printed: boolean;
      fired: boolean;
      paymentStatus: PaymentState;
      allergies: Allergy[];
      name: string;
      specialRequest: string | null;
    }>
  ) {
    const grouped = new Map<number, typeof items>();

    for (const item of items) {
      const guestItems = grouped.get(item.guestNumber) ?? [];
      guestItems.push(item);
      grouped.set(item.guestNumber, guestItems);
    }

    return [...grouped.entries()].map(([guestNumber, guestItems]) => ({
      guestNumber,
      items: guestItems,
    }));
  }
}
