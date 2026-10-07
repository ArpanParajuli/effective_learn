# =============================================================================
# Multi-Stage Production Dockerfile for Vite React TypeScript SPA
# Unprivileged Nginx Runtime with Security Headers & SPA Routing
# =============================================================================

# Stage 1: Build Application
FROM node:24-alpine AS build
WORKDIR /app

# Copy dependency specifications for layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and compile production assets
COPY . .
RUN npm run build

# Stage 2: Production Nginx Serving
FROM nginxinc/nginx-unprivileged:alpine-slim AS runtime

# Copy custom hardened Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose non-privileged HTTP port
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
