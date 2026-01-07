import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import { OrderState } from '@servemate/dto';

const prisma = new PrismaClient();

interface MockOrder {
	tableNumber: number;
	guestsCount: number;
	serverId: number;
	totalAmount: number;
	status: OrderState;
	comments?: string;
	discount: number;
	tip: number;
}

async function generateOrders(count: number) {
	const orders: MockOrder[] = [];

	// Get available tables and servers
	const tables = await prisma.table.findMany();
	const servers = await prisma.user.findMany();

	if (tables.length === 0 || servers.length === 0) {
		throw new Error('No tables or servers found in database');
	}

	const orderStates = Object.values(OrderState);

	for (let i = 0; i < count; i++) {
		const table = faker.helpers.arrayElement(tables);
		const server = faker.helpers.arrayElement(servers);
		const guestsCount = faker.number.int({ min: 1, max: table.capacity });
		const baseAmount = faker.number.float({ min: 20, max: 200, fractionDigits: 2 });
		const discount = faker.number.float({ min: 0, max: baseAmount * 0.2, fractionDigits: 2 });
		const totalAmount = baseAmount - discount;

		orders.push({
			tableNumber: table.tableNumber,
			guestsCount,
			serverId: server.id,
			totalAmount,
			status: faker.helpers.arrayElement(orderStates),
			comments: Math.random() > 0.7 ? faker.commerce.productDescription() : undefined,
			discount,
			tip: faker.number.float({ min: 0, max: totalAmount * 0.2, fractionDigits: 2 }),
		});
	}

	return orders;
}

async function seedOrders() {
	try {
		const ordersCount = 50;
		const orders = await generateOrders(ordersCount);

		const foodItems = await prisma.foodItem.findMany({ take: 10 });
		const drinkItems = await prisma.drinkItem.findMany({ take: 10 });

		if (foodItems.length === 0 || drinkItems.length === 0) {
			throw new Error('No food or drink items found in database');
		}

		for (const order of orders) {
			const createdOrder = await prisma.order.create({
				data: {
					tableNumber: order.tableNumber,
					guestsCount: order.guestsCount,
					serverId: order.serverId,
					totalAmount: order.totalAmount,
					status: order.status,
					comments: order.comments,
					discount: order.discount,
					tip: order.tip,
				},
			});

			// Add food items to order
			const foodItemsCount = faker.number.int({ min: 1, max: 4 });
			for (let i = 0; i < foodItemsCount; i++) {
				const foodItem = faker.helpers.arrayElement(foodItems);
				const guestNumber = faker.number.int({ min: 1, max: order.guestsCount });
				const price = foodItem.price;
				const discount = faker.number.float({ min: 0, max: price * 0.15, fractionDigits: 2 });

				await prisma.orderFoodItem.create({
					data: {
						orderId: createdOrder.id,
						itemId: foodItem.id,
						guestNumber,
						price,
						discount,
						finalPrice: price - discount,
						specialRequest: Math.random() > 0.8 ? faker.commerce.productDescription() : undefined,
					},
				});
			}

			// Add drink items to order
			const drinkItemsCount = faker.number.int({ min: 0, max: 3 });
			for (let i = 0; i < drinkItemsCount; i++) {
				const drinkItem = faker.helpers.arrayElement(drinkItems);
				const guestNumber = faker.number.int({ min: 1, max: order.guestsCount });
				const price = drinkItem.price;
				const discount = faker.number.float({ min: 0, max: price * 0.1, fractionDigits: 2 });

				await prisma.orderDrinkItem.create({
					data: {
						orderId: createdOrder.id,
						itemId: drinkItem.id,
						guestNumber,
						price,
						discount,
						finalPrice: price - discount,
					},
				});
			}
		}

		console.log(`Successfully added ${ordersCount} random orders to the database.`);
	} catch (error) {
		console.error('Error seeding orders:', error);
	} finally {
		await prisma.$disconnect();
	}
}

seedOrders();
