import {
	Allergies,
	foodAndDrinkSchema,
	OrderCreateSchema,
	OrderFullSingleSchema,
	OrderIds,
	OrderSchema,
	OrderSearchSchema,
	OrderSortOptions,
	OrderUpdateProps,
	PaymentStatus,
	PrepareItems,
} from '../../../dto/orders.dto';

describe('Order DTO Schemas', () => {
	describe('OrderSchema', () => {
		it('should validate a correct order object', () => {
			const order = {
				id: 1,
				tableNumber: 1,
				orderNumber: 1,
				guestsCount: 2,
				paymentStatus: PaymentStatus.PAID,
				orderTime: new Date(),
				updatedAt: new Date(),
				serverId: 1,
				totalAmount: 100,
				status: 'RECEIVED',
				comments: 'No onions',
				completionTime: new Date(),
				discount: 10,
				tip: 5,
			};
			expect(() => OrderSchema.parse(order)).not.toThrow();
		});

		it('should invalidate an incorrect order object', () => {
			const order = {
				id: -1,
				tableNumber: -1,
				orderNumber: -1,
				guestsCount: -2,
				paymentStatus: 'INVALID_STATUS',
				orderTime: 'invalid-date',
				updatedAt: 'invalid-date',
				serverId: -1,
				totalAmount: -100,
				status: 'INVALID_STATUS',
				comments: 'No onions',
				completionTime: 'invalid-date',
				discount: -10,
				tip: -5,
			};
			expect(() => OrderSchema.parse(order)).toThrow();
		});
	});

	describe('OrderSearchSchema', () => {
		it('should validate correct order search criteria', () => {
			const criteria = {
				id: 1,
				tableNumber: 1,
				guestNumber: 1,
				allergies: [Allergies.GLUTEN],
				server: '1',
				status: 'RECEIVED',
				page: 1,
				pageSize: 10,
				sortBy: OrderSortOptions.ID,
				sortOrder: 'asc',
			};
			expect(() => OrderSearchSchema.parse(criteria)).not.toThrow();
		});

		it('should invalidate incorrect order search criteria', () => {
			const criteria = {
				id: -1,
				tableNumber: -1,
				guestNumber: -1,
				allergies: ['INVALID_ALLERGY'],
				server: 'invalid-server',
				status: 'INVALID_STATUS',
				page: -1,
				pageSize: 101,
				sortBy: 'INVALID_SORT_OPTION',
				sortOrder: 'invalid-sortOrder',
			};
			expect(() => OrderSearchSchema.parse(criteria)).toThrow();
		});
	});

	describe('foodAndDrinkSchema', () => {
		it('should validate correct food and drink item', () => {
			const item = {
				foodItemId: 1,
				quantity: 1,
				price: 10,
				guestNumber: 1,
			};
			expect(() => foodAndDrinkSchema.parse(item)).not.toThrow();
		});

		it('should invalidate incorrect food and drink item', () => {
			const item = {
				foodItemId: -1,
				quantity: -1,
				price: -10,
				guestNumber: -1,
			};
			expect(() => foodAndDrinkSchema.parse(item)).toThrow();
		});
	});

	describe('OrderCreateSchema', () => {
		it('should validate a correct create order object', () => {
			const order = {
				tableNumber: 1,
				guestsCount: 2,
				serverId: 1,
				totalAmount: 100,
				status: 'RECEIVED',
				comments: 'No onions',
				discount: 10,
				foodItems: [
					{
						guestNumber: 1,
						items: [
							{
								price: 10,
								discount: 0,
								itemId: 1,
								finalPrice: 10,
								specialRequest: null,
								allergies: [],
								printed: false,
								fired: false,
								guestNumber: 1,
							},
						],
					},
				],
				drinkItems: [],
			};
			expect(() => OrderCreateSchema.parse(order)).not.toThrow();
		});

		it('should invalidate an incorrect create order object', () => {
			const order = {
				tableNumber: -1,
				guestsCount: -2,
				serverId: -1,
				totalAmount: -100,
				status: 'INVALID_STATUS',
				comments: 'No onions',
				discount: -10,
				foodItems: [],
				drinkItems: [],
			};
			expect(() => OrderCreateSchema.parse(order)).toThrow();
		});
	});

	describe('OrderFullSingleSchema', () => {
		it('should validate a correct full single order object', () => {
			const order = {
				id: 1,
				tableNumber: 1,
				guestsCount: 2,
				paymentStatus: PaymentStatus.PAID,
				orderTime: new Date(),
				updatedAt: new Date(),
				serverId: 1,
				totalAmount: 100,
				status: 'RECEIVED',
				comments: 'No onions',
				completionTime: new Date(),
				discount: 10,
				tip: 5,
				server: {
					name: 'John Doe',
					id: 1,
				},
				foodItems: [
					{
						guestNumber: 1,
						items: [
							{
								price: 10,
								discount: 0,
								itemId: 1,
								finalPrice: 10,
								specialRequest: null,
								allergies: [],
								printed: false,
								fired: false,
								guestNumber: 1,
							},
						],
					},
				],
				drinkItems: [],
			};
			expect(() => OrderFullSingleSchema.parse(order)).not.toThrow();
		});

		it('should invalidate an incorrect full single order object', () => {
			const order = {
				id: -1,
				tableNumber: -1,
				guestsCount: -2,
				paymentStatus: 'INVALID_STATUS',
				orderTime: 'invalid-date',
				updatedAt: 'invalid-date',
				serverId: -1,
				totalAmount: -100,
				status: 'INVALID_STATUS',
				comments: 'No onions',
				completionTime: 'invalid-date',
				discount: -10,
				tip: -5,
				server: {
					name: '',
					id: -1,
				},
				foodItems: [],
				drinkItems: [],
			};
			expect(() => OrderFullSingleSchema.parse(order)).toThrow();
		});
	});

	describe('OrderUpdateProps', () => {
		it('should validate correct order update properties', () => {
			const updateProps = {
				tableNumber: 1,
				guestsCount: 2,
				totalAmount: 100,
				status: 'RECEIVED',
				comments: 'No onions',
				discount: 10,
				tip: 5,
			};
			expect(() => OrderUpdateProps.parse(updateProps)).not.toThrow();
		});

		it('should invalidate incorrect order update properties', () => {
			const updateProps = {
				tableNumber: -1,
				guestsCount: -2,
				totalAmount: -100,
				status: 'INVALID_STATUS',
				comments: 'No onions',
				discount: -10,
				tip: -5,
			};
			expect(() => OrderUpdateProps.parse(updateProps)).toThrow();
		});
	});

	describe('OrderIds', () => {
		it('should validate correct order IDs', () => {
			const ids = { ids: [1, 2, 3] };
			expect(() => OrderIds.parse(ids)).not.toThrow();
		});

		it('should invalidate incorrect order IDs', () => {
			const ids = { ids: [-1, -2, -3] };
			expect(() => OrderIds.parse(ids)).toThrow();
		});
	});

	describe('PrepareItems', () => {
		it('should validate correct prepare items', () => {
			const items = {
				foodItems: [
					{
						price: 10,
						discount: 0,
						itemId: 1,
						finalPrice: 10,
						specialRequest: null,
						allergies: [],
						printed: false,
						fired: false,
						guestNumber: 1,
					},
				],
				drinkItems: [],
			};
			expect(() => PrepareItems.parse(items)).not.toThrow();
		});

		it('should invalidate incorrect prepare items', () => {
			const items = {
				foodItems: [
					{
						price: -10,
						discount: -1,
						itemId: -1,
						finalPrice: -10,
						specialRequest: null,
						allergies: ['INVALID_ALLERGY'],
						printed: false,
						fired: false,
						guestNumber: -1,
					},
				],
				drinkItems: [],
			};
			expect(() => PrepareItems.parse(items)).toThrow();
		});
	});
});
