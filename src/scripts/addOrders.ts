import { faker } from '@faker-js/faker';
import { PrismaPg } from '@prisma/adapter-pg';
import { Allergy, PrismaClient } from '@prisma/client';
import { OrderState } from '@servemate/dto';
import 'dotenv/config';
import { Pool } from 'pg';

const connectionString = 'postgresql://inmo:!From1to8@localhost:5432/servemate?schema=public';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface MockOrder {
	tableNumber: number;
	guestsCount: number;
	serverId: number;
	totalAmount: number;
	status: OrderState;
	comments?: string;
	discount: number;
	tip: number;
	orderTime: Date;
}

// Generate random date between startDate and endDate
function generateRandomDate(startDate: Date, endDate: Date): Date {
	return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
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
	
	// Generate orders between January 19, 2026 and February 19, 2026
	const startDate = new Date('2026-01-19');
	const endDate = new Date('2026-02-19');

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
			orderTime: generateRandomDate(startDate, endDate),
		});
	}

	return orders;
}

async function seedOrders() {
	try {
		const ordersCount = 100; // Увеличу на 100 для месячных данных
		const orders = await generateOrders(ordersCount);

		const foodItems = await prisma.foodItem.findMany({ take: 10 });
		const drinkItems = await prisma.drinkItem.findMany({ take: 10 });

		if (foodItems.length === 0 || drinkItems.length === 0) {
			throw new Error('No food or drink items found in database');
		}

		// Get all allergy values
		const allergies = Object.values(Allergy);

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
					orderTime: order.orderTime,
				},
			});

			// Add food items to order
			const foodItemsCount = faker.number.int({ min: 1, max: 4 });
			for (let i = 0; i < foodItemsCount; i++) {
				const foodItem = faker.helpers.arrayElement(foodItems);
				const guestNumber = faker.number.int({ min: 1, max: order.guestsCount });
				const price = foodItem.price;
				const discount = faker.number.float({ min: 0, max: price * 0.15, fractionDigits: 2 });

				const orderFoodItem = await prisma.orderFoodItem.create({
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

				// Add random allergies (30% chance to have allergies, 1-3 allergies)
				if (Math.random() > 0.7) {
					const allergyCount = faker.number.int({ min: 1, max: 3 });
					const selectedAllergies = faker.helpers.arrayElements(allergies, allergyCount);

					for (const allergy of selectedAllergies) {
						try {
							await prisma.orderFoodItemAllergy.create({
								data: {
									orderFoodItemId: orderFoodItem.id,
									allergy: allergy as Allergy,
								},
							});
						} catch (error) {
							// Skip if allergy already exists for this item
							console.log(`Allergy ${allergy} already exists for food item ${orderFoodItem.id}`);
						}
					}
				}
			}

			// Add drink items to order
			const drinkItemsCount = faker.number.int({ min: 0, max: 3 });
			for (let i = 0; i < drinkItemsCount; i++) {
				const drinkItem = faker.helpers.arrayElement(drinkItems);
				const guestNumber = faker.number.int({ min: 1, max: order.guestsCount });
				const price = drinkItem.price;
				const discount = faker.number.float({ min: 0, max: price * 0.1, fractionDigits: 2 });

				const orderDrinkItem = await prisma.orderDrinkItem.create({
					data: {
						orderId: createdOrder.id,
						itemId: drinkItem.id,
						guestNumber,
						price,
						discount,
						finalPrice: price - discount,
					},
				});

				// Add random allergies (20% chance to have allergies, 1-2 allergies)
				if (Math.random() > 0.8) {
					const allergyCount = faker.number.int({ min: 1, max: 2 });
					const selectedAllergies = faker.helpers.arrayElements(allergies, allergyCount);

					for (const allergy of selectedAllergies) {
						try {
							await prisma.orderDrinkItemAllergy.create({
								data: {
									orderDrinkItemId: orderDrinkItem.id,
									allergy: allergy as Allergy,
								},
							});
						} catch (error) {
							// Skip if allergy already exists for this item
							console.log(`Allergy ${allergy} already exists for drink item ${orderDrinkItem.id}`);
						}
					}
				}
			}
		}

		console.log(`Successfully added ${ordersCount} random orders (from Jan 19 to Feb 19) with allergies to the database.`);
	} catch (error) {
		console.error('Error seeding orders:', error);
	} finally {
		await prisma.$disconnect();
	}
}

seedOrders();
