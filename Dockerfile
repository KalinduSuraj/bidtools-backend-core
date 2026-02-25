# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and lock file
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the app (if using TypeScript)
RUN pnpm run build

# Expose the port (match .env PORT or default 3000)
EXPOSE 4000

# Start the app
CMD ["pnpm", "start:prod"]
