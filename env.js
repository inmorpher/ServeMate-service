"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    //production
    PRODUCTION: zod_1.z
        .enum(['true', 'false', '1', '0'])
        .transform((value) => value === 'true' || value === '1'),
    //SERVER
    PORT: zod_1.z.coerce.number().int().positive().default(3000),
    DATABASE_URL: zod_1.z.string(),
    // JWT TOKENS
    TOKEN_CACHE_TTL: zod_1.z.coerce.number().int().positive().default(3600000),
    JWT_SECRET: zod_1.z.string(),
    JWT_REFRESH: zod_1.z.string(),
    JWT_EXPIRES_IN: zod_1.z.string(),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string(),
    // LOGGING
    LOG_TO_FILE: zod_1.z
        .enum(['true', 'false', '1', '0'])
        .transform((value) => value === 'true' || value === '1'),
});
exports.ENV = envSchema.parse(process.env);
