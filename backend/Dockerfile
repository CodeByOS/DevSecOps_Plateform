#! Stage 1: Base image
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

#! Stage 2: Install dependencies
FROM base AS deps

# Copy package manifests first for better layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

#! Stage 3: Final production image
FROM base AS production

# Install git — required by cloneService.js to clone repositories before scanning
RUN apk add --no-cache git

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source code
COPY src ./src

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

# Expose the port the app listens on
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

# Start the server
CMD ["node", "src/server.js"]
