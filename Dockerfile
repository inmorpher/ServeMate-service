FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY src/dto-package ./src/dto-package
COPY prisma ./prisma

RUN npm ci

COPY . .

# Генерируем Prisma клиент
RUN npx prisma generate

# Собираем TypeScript в JavaScript
RUN npm run build

# ===== Production stage =====
FROM node:24-alpine

WORKDIR /app

# Копируем собранный app вместе с уже сгенерированным Prisma client и зависимостями.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Запускаем собранное приложение
CMD ["node", "dist/main.js"]
