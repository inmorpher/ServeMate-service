import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
	PORT: z.string().default('3000'),
	DATABASE_URL: z.string(),
	// JWT TOKENS
	JWT_SECRET: z.string(),
	JWT_REFRESH: z.string(),
	JWT_EXPIRES_IN: z.string(),
	JWT_REFRESH_EXPIRES_IN: z.string(),
	// LOGGING
	LOG_TO_FILE: z
		.enum(['true', 'false', '1', '0'])
		.transform((value) => value === 'true' || value === '1'),
});

export const ENV = envSchema.parse(process.env);
