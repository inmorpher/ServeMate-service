FROM node:24.19.0-trixie-slim AS builder

WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json ./
COPY prisma ./prisma

RUN apt-get update \
	&& apt-get upgrade -y \
	&& apt-get install -y --no-install-recommends ca-certificates \
	&& rm -rf /var/lib/apt/lists/* \
	&& pnpm install --frozen-lockfile

COPY . .

# Генерируем Prisma клиент
RUN npx prisma generate

# Собираем TypeScript в JavaScript
RUN npm run build

# ===== Production stage =====
FROM node:24.19.0-trixie-slim

WORKDIR /app

RUN apt-get update \
	&& apt-get upgrade -y \
	&& apt-get install -y --no-install-recommends ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

# Копируем собранный app вместе с уже сгенерированным Prisma client и зависимостями.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Запускаем собранное приложение
CMD ["node", "dist/main.js"]
