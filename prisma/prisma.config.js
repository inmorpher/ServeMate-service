"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    schema: './prisma/schema.prisma',
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
};
