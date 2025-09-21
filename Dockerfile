
# 1. Base Image: Use a specific Node.js version
FROM node:20-slim AS base

# 2. Set working directory
WORKDIR /app

# 3. Install dependencies
# Use glob syntax to copy both package.json and package-lock.json
COPY package*.json ./
RUN npm install

# 4. Copy source code
COPY . .

# 5. Build the application
RUN npm run build

# 6. Production Image: Use a small, secure base image
FROM node:20-slim AS production

WORKDIR /app

# Copy built assets from the 'base' stage
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/package.json ./package.json

# Set environment to production
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 3000

# The command to start the application
CMD ["npm", "start"]
