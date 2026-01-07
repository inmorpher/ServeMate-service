FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY dto-package ./dto-package
COPY prisma ./prisma

RUN npm ci

COPY . .

# Генерируем Prisma клиент
RUN npx prisma generate

# Собираем TypeScript в JavaScript
RUN npm run build

# ===== Production stage =====
FROM node:22-alpine

WORKDIR /app

# Копируем только production dependencies
COPY package.json package-lock.json ./

RUN npm ci --only=production

# Копируем собранный dist из builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Запускаем собранное приложение
CMD ["node", "dist/main.js"]
