FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Copy prisma schema before generating client
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the app source
COPY . .

# Build the app
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port the app will run on
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start:prod"]