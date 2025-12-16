import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import { CreateUser, UserRole } from '@servemate/dto';
import bcrypt from 'bcrypt';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();

async function generateUsers(count: number) {
	const users: CreateUser[] = [];

	for (let i = 0; i < count; i++) {
		const firstName = faker.person.firstName();
		const lastName = faker.person.lastName();
		const email = faker.internet.email({ firstName, lastName });
		const password = await bcrypt.hash(faker.internet.password(), 10);
		const role = faker.helpers.arrayElement(Object.values(UserRole));

		users.push({
			name: `${firstName} ${lastName}`,
			email,
			password,
			role,
		});
	}

	users.push({
		name:'Super Admin',
		email:'super@super.com',
		password: await hashPassword('123321'),
		role: UserRole.ADMIN,
	})

	return users;
}

async function seedUsers() {
	try {
		const users = await generateUsers(100);

		for (const user of users) {
			await prisma.user.create({
				data: user,
			});
		}

		console.log('Successfully added 100 random users to the database.');
	} catch (error) {
		console.error('Error seeding users:', error);
	} finally {
		await prisma.$disconnect();
	}
}

seedUsers();
