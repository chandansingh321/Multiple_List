# Use Node.js 20 Alpine for smaller image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Expose the default Next.js port
EXPOSE 3000

# Start the app in development mode for Docker
CMD ["npm", "run", "dev"]