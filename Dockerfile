# Stage 1: Build the Angular app
FROM node:20.11.1 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy the entire application source
COPY . .

# Build the Angular app for production with Sentry sourcemaps
RUN npm run build:prod

# Stage 2: Runtime - serve the built app
FROM node:20.11.1-slim

WORKDIR /app

# Copy package files for production install
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy the Express server file
COPY server.js .

# Copy the built Angular app from Stage 1
COPY --from=builder /app/dist ./dist

# Expose port 8080
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
