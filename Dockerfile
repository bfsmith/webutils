# syntax=docker/dockerfile:1.4
# Use Bun as the package manager and JavaScript runtime
FROM oven/bun:1-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1-alpine AS production

# Set working directory
WORKDIR /app

# Copy built application from build stage
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./
COPY --from=base /app/server.ts ./

# Create non-root user for security
RUN addgroup -g 1001 -S bunjs && \
    adduser -S solidjs -u 1001

# Change ownership of app directory to non-root user
RUN chown -R solidjs:bunjs /app
USER solidjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start the application using Bun
CMD ["bun", "server.ts"]
