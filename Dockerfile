FROM node:18-alpine

WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Install Prisma globally
RUN npm install -g prisma

# Copy app source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the app
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port the app will run on
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start:prod"]