#! Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests first for better layer caching
COPY package*.json ./

# Install all dependencies (dev deps needed to build)
RUN npm ci

# Copy source code
COPY . .

# Build the production bundle (outputs to /app/dist)
RUN npm run build

#! Stage 2: Serve with nginx
FROM nginx:alpine AS production

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing support
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:5173 || exit 1

CMD ["nginx", "-g", "daemon off;"]
