import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import { TableCondition } from '@servemate/dto';

const prisma = new PrismaClient();

interface MockTable {
	tableNumber: number;
	capacity: number;
	status: TableCondition;
	additionalCapacity: number;
	originalCapacity: number;
}

async function generateTables(count: number) {
	const tables: MockTable[] = [];
	const tableNumbers = new Set<number>();

	// Generate unique table numbers
	while (tableNumbers.size < count) {
		tableNumbers.add(faker.number.int({ min: 1, max: count * 2 }));
	}

	const tableConditions = Object.values(TableCondition);

	Array.from(tableNumbers).forEach((tableNumber) => {
		const capacity = faker.helpers.arrayElement([2, 2, 4, 4, 6, 8]);
		const additionalCapacity = faker.number.int({ min: 0, max: 2 });

		tables.push({
			tableNumber,
			capacity,
			status: faker.helpers.arrayElement(tableConditions),
			additionalCapacity,
			originalCapacity: capacity,
		});
	});

	return tables;
}

async function seedTables() {
	try {
		const tablesCount = 30;
		const tables = await generateTables(tablesCount);

		for (const table of tables) {
			await prisma.table.create({
				data: {
					tableNumber: table.tableNumber,
					capacity: table.capacity,
					status: table.status,
					additionalCapacity: table.additionalCapacity,
					originalCapacity: table.originalCapacity,
				},
			});
		}

		console.log(`Successfully added ${tablesCount} random tables to the database.`);
	} catch (error) {
		console.error('Error seeding tables:', error);
	} finally {
		await prisma.$disconnect();
	}
}

seedTables();
