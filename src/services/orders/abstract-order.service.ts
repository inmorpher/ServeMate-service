import { Prisma, PrismaClient } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { inject, injectable } from 'inversify';
import { BaseService } from '../../common/base.service';
import {
	GuestItemsDTO,
	OrderCreateDTO,
	OrderFullSingleDTO,
	OrderItemExt,
} from '../../dto/orders.dto';
import { TYPES } from '../../types';

export type FlattenedFoodItem = Prisma.OrderFoodItemCreateManyOrderInput;

export type FlattenedDrinkItem = Prisma.OrderDrinkItemCreateManyOrderInput;

export const ORDER_INCLUDE: Prisma.OrderInclude<DefaultArgs> = {
	server: {
		select: { name: true, id: true },
	},
	foodItems: {
		select: {
			id: true,
			itemId: true,
			foodItem: { select: { name: true, id: true } },
			guestNumber: true,
			price: true,
			discount: true,
			finalPrice: true,
			specialRequest: true,
			allergies: true,
			printed: true,
			fired: true,
		},
		orderBy: [{ guestNumber: 'asc' }, { foodItem: { name: 'asc' } }],
	},
	drinkItems: {
		select: {
			id: true,
			itemId: true,
			drinkItem: { select: { name: true, id: true } },
			guestNumber: true,
			price: true,
			discount: true,
			finalPrice: true,
			specialRequest: true,
			allergies: true,
			printed: true,
			fired: true,
		},
		orderBy: [{ guestNumber: 'asc' }, { drinkItem: { name: 'asc' } }],
	},
};

@injectable()
export abstract class AbstractOrderService extends BaseService {
	constructor(@inject(TYPES.PrismaClient) protected prisma: PrismaClient) {
		super();
	}

	/**
	 * Calculates the total amount for an order, including food and drink items, and applies any discount.
	 *
	 * This function sums up the prices of all food and drink items in the order, applies the specified
	 * discount percentage, and returns the final total amount rounded to two decimal places.
	 *
	 * @param {OrderCreateDTO} order - The order object containing food items, drink items, and discount information.
	 * @param {GuestItemsDTO[]} order.foodItems - An array of food items grouped by guest.
	 * @param {GuestItemsDTO[]} order.drinkItems - An array of drink items grouped by guest.
	 * @param {number} order.discount - The discount percentage to be applied to the total amount.
	 *
	 * @returns {number} The total amount of the order after applying the discount, rounded to two decimal places.
	 */
	protected calculateTotalAmount(order: OrderCreateDTO): number {
		// Calculate the total amount for food items.
		const foodTotal = order.foodItems.reduce(
			(sum, guest) => sum + guest.items.reduce((itemSum, item) => itemSum + item.finalPrice, 0),
			0
		);
		// Calculate the total amount for drink items.
		const drinkTotal = order.drinkItems.reduce(
			(sum, guest) => sum + guest.items.reduce((itemSum, item) => itemSum + item.finalPrice, 0),
			0
		);

		// Calculate the total amount before discount.
		const totalBeforeDiscount = foodTotal + drinkTotal;

		// Apply the discount to the total amount.
		const discountAmount = totalBeforeDiscount * (order.discount / 100);
		const totalAfterDiscount = totalBeforeDiscount - discountAmount;

		// Round the total amount to two decimal places.
		return Number(totalAfterDiscount.toFixed(2));
	}

	/**
	 * Flattens a nested structure of guest items into a single array of food or drink items.
	 *
	 * This function takes an array of GuestItemsDTO objects, each containing items ordered by a guest,
	 * and transforms it into a flat array of either FlattenedFoodItem or FlattenedDrinkItem objects.
	 * The flattened structure is suitable for bulk creation in the database.
	 *
	 * @param {GuestItemsDTO[]} items - An array of GuestItemsDTO objects, each representing a guest's order.
	 * @returns {(FlattenedItem[])} A flattened array of food or drink items,
	 *          where each item includes guest-specific information and is ready for database insertion.
	 */
	protected flattenItems(items: GuestItemsDTO[]): FlattenedFoodItem[] | FlattenedDrinkItem[] {
		return items.flatMap((guest) =>
			guest.items.map((item) => ({
				itemId: item.itemId,
				price: item.price,
				discount: item.discount ?? 0,
				finalPrice: item.finalPrice,
				guestNumber: guest.guestNumber,
				specialRequest: item.specialRequest ?? '',
				allergies: item.allergies ?? [],
				...(item.id !== undefined && { id: item.id }),
				...(item.printed !== undefined && { printed: item.printed }),
				...(item.fired !== undefined && { fired: item.fired }),
			}))
		);
	}

	protected async createOrderInDatabase(
		order: OrderCreateDTO & {
			flattenedFoodItems: FlattenedFoodItem[];
			flattenedDrinkItems: FlattenedDrinkItem[];
		}
	): Promise<OrderFullSingleDTO> {
		const {
			status,
			serverId,
			allergies,
			guestsCount,
			tableNumber,
			flattenedFoodItems,
			flattenedDrinkItems,
			discount,
			totalAmount,
			comments,
		} = order;

		const createdOrder = await this.prisma.order.create({
			data: {
				status,
				server: { connect: { id: serverId } },
				allergies: allergies,
				guestsCount,
				table: { connect: { tableNumber } },
				foodItems: {
					createMany: {
						data: flattenedFoodItems,
					},
				},
				drinkItems: {
					createMany: {
						data: flattenedDrinkItems,
					},
				},
				discount: discount || 0,
				totalAmount,
				comments,
			},
			include: ORDER_INCLUDE,
		});

		const groupedFoodItem = this.groupItems(createdOrder.foodItems);
		const groupedDrinkItem = this.groupItems(createdOrder.drinkItems);

		return {
			...createdOrder,
			foodItems: groupedFoodItem,
			drinkItems: groupedDrinkItem,
		};
	}

	/**
	 * Creates a new order in the database with the provided order details.
	 *
	 * @param order - The order details including flattened food and drink items.
	 * @returns A promise that resolves to the full order details after creation.
	 *
	 * @template OrderCreateDTO - The type for creating an order.
	 * @template FlattenedFoodItem - The type for flattened food items.
	 * @template FlattenedDrinkItem - The type for flattened drink items.
	 * @template OrderFullSingleDTO - The type for the full order details.
	 */
	protected async createInDbTest(
		order: OrderCreateDTO & {
			flattenedFoodItems: FlattenedFoodItem[];
			flattenedDrinkItems: FlattenedDrinkItem[];
		}
	): Promise<OrderFullSingleDTO> {
		const createdOrder = await this.prisma.order.create({
			data: {
				status: order.status,
				server: { connect: { id: order.serverId } },
				allergies: order.allergies,
				guestsCount: order.guestsCount,
				table: { connect: { tableNumber: order.tableNumber } },
				foodItems: {
					createMany: {
						data: order.flattenedFoodItems,
					},
				},
				drinkItems: {
					createMany: {
						data: order.flattenedDrinkItems,
					},
				},
				discount: order.discount || 0,
				totalAmount: order.totalAmount,
				comments: order.comments,
			},
			include: ORDER_INCLUDE,
		});

		return this.formatOrder(createdOrder);
	}

	/**
	 * Prepares the order items by merging and correcting their prices, and calculates the total amount.
	 *
	 * @param order - The original order data, which can be either an OrderFullSingleDTO or an OrderCreateDTO.
	 * @param updatedData - Optional partial data to update the order with.
	 * @returns A promise that resolves to an object containing the merged and flattened food and drink items,
	 *          and the total amount.
	 *
	 * @remarks
	 * - If `updatedData` is provided, the food and drink items in the order will be merged with the items in `updatedData`.
	 * - The prices of the food and drink items will be corrected using the `correctItemPrices` method.
	 * - The total amount will be calculated using the `calculateTotalAmount` method.
	 * - The food and drink items will be flattened using the `flattenItems` method.
	 *
	 * @example
	 * ```typescript
	 * const order: OrderCreateDTO = { ... };
	 * const updatedData: Partial<OrderCreateDTO> = { ... };
	 * const result = await prepareOrderItems(order, updatedData);
	 * console.log(result.mergedItems.foodItems);
	 * console.log(result.mergedItems.drinkItems);
	 * console.log(result.totalAmount);
	 * ```
	 */
	protected async prepareOrderItems(
		order: OrderFullSingleDTO | OrderCreateDTO,
		updatedData?: Partial<OrderCreateDTO>
	): Promise<{
		mergedItems: {
			foodItems: FlattenedFoodItem[];
			drinkItems: FlattenedDrinkItem[];
		};
		totalAmount: number;
	}> {
		let foodItems = order.foodItems;
		let drinkItems = order.drinkItems;

		if (updatedData) {
			drinkItems = this.mergeItems(order.drinkItems, updatedData?.drinkItems || []);
			foodItems = this.mergeItems(order.foodItems, updatedData?.foodItems || []);
		}

		const [correctedFoodItems, correctedDrinkItems] = await this.correctItemPrices(
			foodItems,
			drinkItems
		);

		const totalAmount = this.calculateTotalAmount({
			...order,
			...updatedData,
			foodItems: correctedFoodItems,
			drinkItems: correctedDrinkItems,
		});

		const flattenDrinkItems = this.flattenItems(correctedDrinkItems);
		const flattenFoodItems = this.flattenItems(correctedFoodItems);

		return {
			mergedItems: {
				foodItems: flattenFoodItems,
				drinkItems: flattenDrinkItems,
			},
			totalAmount,
		};
	}

	/**
	 * Groups order items by guest number.
	 *
	 * This function takes an array of order items and organizes them into a structure
	 * where items are grouped by the guest who ordered them. It transforms the flat
	 * list of items into a nested structure, making it easier to manage and display
	 * orders on a per-guest basis.
	 *
	 * @param {T[]} items - An array of order items. Each item should extend OrderItemDTO
	 *                      and contain information about the ordered item and the guest who ordered it.
	 *
	 * @returns {GuestItemsDTO[]} An array of GuestItemsDTO objects. Each object represents
	 *                            a guest and contains an array of items ordered by that guest.
	 *                            The returned structure makes it easy to see all items
	 *                            ordered by each guest.
	 */
	protected groupItems<T extends OrderItemExt>(items: T[]): GuestItemsDTO[] {
		const groupedItems = items.reduce((acc, item) => {
			if (!acc[item.guestNumber]) {
				acc[item.guestNumber] = [];
			}
			acc[item.guestNumber].push({
				id: item.id,
				name: item.foodItem?.name || item.drinkItem?.name,
				allergies: item.allergies,
				price: item.price,
				discount: item.discount,
				finalPrice: item.finalPrice,
				printed: item.printed,
				fired: item.fired,
				itemId: item.foodItem?.id || item.drinkItem?.id,
				guest: item.guestNumber,
			});
			return acc;
		}, {} as Record<number, any[]>);

		return Object.entries(groupedItems).map(([guestNumber, items]) => ({
			guestNumber: Number(guestNumber),
			items,
		}));
	}

	/**
	 * Corrects the prices of items for each guest based on the provided price map.
	 *
	 * This function updates the price and finalPrice of each item in the guest's order
	 * if a new price is available in the provided price map. If no new price is found,
	 * the original price is retained.
	 *
	 * @param items - An array of GuestItemsDTO objects representing the items ordered by each guest.
	 * @param prices - A Map containing the updated prices, where the key is the item ID and the value is the new price.
	 * @returns An array of GuestItemsDTO objects with potentially updated prices for each item.
	 */
	protected correctPrices(items: GuestItemsDTO[], prices: Map<number, number>): GuestItemsDTO[] {
		return items.map((guest) => ({
			...guest,
			items: guest.items.map((item) => {
				const currentPrice = prices.get(item.itemId) || item.price;
				const discount = item.discount || 0;
				const finalPrice = currentPrice * (1 - discount / 100);
				return {
					...item,
					price: currentPrice,
					discount: discount,
					finalPrice: Number(finalPrice.toFixed(2)),
				};
			}),
		}));
	}

	/**
	 * Corrects the prices of food and drink items in an order based on the latest prices from the database.
	 *
	 * This function fetches the current prices for all food and drink items in the order from the database,
	 * and then updates the prices in the order to match the current prices. This ensures that the order
	 * always uses the most up-to-date pricing information.
	 *
	 * @param foodItems - An array of GuestItemsDTO objects representing the food items in the order,
	 *                    grouped by guest.
	 * @param drinkItems - An array of GuestItemsDTO objects representing the drink items in the order,
	 *                     grouped by guest.
	 * @returns A Promise that resolves to a tuple containing two arrays:
	 *          - The first array contains the corrected food items (GuestItemsDTO[])
	 *          - The second array contains the corrected drink items (GuestItemsDTO[])
	 *          Both arrays have their prices updated to match the current prices in the database.
	 */
	protected async correctItemPrices(
		foodItems: GuestItemsDTO[],
		drinkItems: GuestItemsDTO[]
	): Promise<[GuestItemsDTO[], GuestItemsDTO[]]> {
		// Obtaining food and drink item IDs from the order

		const foodItemIds = foodItems.flatMap((guest) => guest.items.map((item) => item.itemId));
		const drinkItemIds = drinkItems.flatMap((guest) => guest.items.map((item) => item.itemId));

		// Fetching current prices for food and drink items from the database and updating the order items accordingly
		const [dbFoodItems, dbDrinkItems] = await Promise.all([
			await this.prisma.foodItem.findMany({
				where: { id: { in: foodItemIds } },
			}),
			await this.prisma.drinkItem.findMany({
				where: { id: { in: drinkItemIds } },
			}),
		]);

		// Creating price maps for food and drink items from the database and updating the order items accordingly
		const foodPrices = new Map(dbFoodItems.map((foodItem) => [foodItem.id, foodItem.price]));
		const drinkPrices = new Map(dbDrinkItems.map((drinkItem) => [drinkItem.id, drinkItem.price]));

		// Updating prices in the order to match the current prices from the database
		return [this.correctPrices(foodItems, foodPrices), this.correctPrices(drinkItems, drinkPrices)];
	}

	/**
	 * Merges new items into an existing list of guest items, combining items for the same guest.
	 *
	 * This function takes two arrays of GuestItemsDTO objects and combines them, ensuring that
	 * items for the same guest are merged together. If a guest exists in both arrays, their items
	 * are combined. If a guest only exists in the new items, they are added to the merged list.
	 *
	 * @param existingItems - An array of GuestItemsDTO objects representing the current items for each guest.
	 * @param newItems - An array of GuestItemsDTO objects representing new items to be merged.
	 * @returns An array of GuestItemsDTO objects with the existing and new items merged together.
	 */
	protected mergeItems(existingItems: GuestItemsDTO[], newItems: GuestItemsDTO[]): GuestItemsDTO[] {
		const mergedItems = [...existingItems];

		newItems.forEach((newItem: GuestItemsDTO) => {
			const existingGuestItems = mergedItems.find(
				(guest) => guest.guestNumber === newItem.guestNumber
			);
			if (existingGuestItems) {
				existingGuestItems.items.push(...newItem.items);
			} else {
				mergedItems.push(newItem);
			}
		});

		return mergedItems;
	}

	protected formatOrder(order: any): OrderFullSingleDTO {
		const groupedFoodItems = this.groupItems(order.foodItems);
		const groupedDrinkItems = this.groupItems(order.drinkItems);
		return {
			...order,
			foodItems: groupedFoodItems,
			drinkItems: groupedDrinkItems,
		};
	}
}
