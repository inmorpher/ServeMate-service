FROM node:20-alpine

WORKDIR /app

# Install build dependencies including OpenSSL
RUN apk add --no-cache python3 make g++ openssl

# Install PM2 globally
RUN npm install -g pm2

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

COPY ecosystem.config.js .
# Copy prisma schema
COPY prisma ./prisma/

# Remove the custom generator from schema.prisma during build
RUN sed -i '/^generator enums {/,/^}/d' ./prisma/schema.prisma

# Generate Prisma client with a dummy DATABASE_URL
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Copy the rest of the app source
COPY . .

# Build the app
RUN npm run build

# Set environment variables for runtime
ENV NODE_ENV=production
ENV PORT=3002

# Expose the port the app will run on
EXPOSE 3002

# Start the app
CMD ["pm2-runtime", "ecosystem.config.js"]