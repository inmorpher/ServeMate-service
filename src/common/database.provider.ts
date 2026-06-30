import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "@prisma/client";
import { injectable } from "inversify";
import 'reflect-metadata';
import { HTTPError } from "../errors/http-error.class";

@injectable()
export class DatabaseProvider {
	private static instance: PrismaClient|null = null;
	

		
	static getInstance(): PrismaClient {
		if (!DatabaseProvider.instance) {
			const connectionString = process.env.DATABASE_URL;

			if(!connectionString) {
				console.error(`\x1b[31m✗ Failed to connect to database:\x1b[0m DATABASE_URL is not defined in environment variables`);
				throw new HTTPError(500, 'DatabaseProvider', 'DATABASE_URL is not defined in environment variables');
			}

			console.log(`\x1b[36m🔗 Connecting to database at ${new URL(connectionString).hostname}...\x1b[0m`);

			const adapter = new PrismaPg(connectionString);

			DatabaseProvider.instance = new PrismaClient({
				adapter,
				log: [
					{
						emit: 'stdout',
						level: 'info'
					}, 
				
				]
			});
				
			
		}
		return DatabaseProvider.instance;
	}

	static async connect(): Promise<void> {
		try {
			const prisma = DatabaseProvider.getInstance();
			await prisma.$connect();

			await prisma.$queryRaw`SELECT 1`; // Simple check for database connectivity
			console.log(`\x1b[32m✓ Successfully connected to the database\x1b[0m`);
		} catch (error) {
			console.error(`\x1b[31m✗ Failed to connect to the database:\x1b[0m`, error);
			throw new HTTPError(500, 'DatabaseProvider', 'Failed to connect to the database', error? error.toString() : undefined);
		}
	}

	static async disconnect(): Promise<void> {
		try {
			if (DatabaseProvider.instance) {
				await DatabaseProvider.instance.$disconnect();
				DatabaseProvider.instance = null;
				console.log(`\x1b[32m✓ Successfully disconnected from the database\x1b[0m`);
			} 
		} catch (error) {
			console.error(`\x1b[31m✗ Failed to disconnect from the database:\x1b[0m`, error);
			throw new HTTPError(500, 'DatabaseProvider', 'Failed to disconnect from the database', error? error.toString() : undefined);
		}
	}
}