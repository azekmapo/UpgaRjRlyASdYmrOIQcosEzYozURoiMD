# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments
ARG VITE_APP_NAME="Mon PFE"
ARG VITE_API_BASE_URL="http://localhost"
ARG VITE_SOCKET_URL="http://localhost"
ARG VITE_SOKETI_APP_KEY="9999"
ARG VITE_SOKETI_HOST="127.0.0.1"
ARG VITE_SOKETI_PORT="3000"
ARG VITE_SOKETI_USE_TLS="false"

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install

# Copy source code
COPY . .

# Set environment variables for build
ENV VITE_APP_NAME="${VITE_APP_NAME}"
ENV VITE_API_BASE_URL="${VITE_API_BASE_URL}"
ENV VITE_SOCKET_URL="${VITE_SOCKET_URL}"
ENV VITE_SOKETI_APP_KEY="${VITE_SOKETI_APP_KEY}"
ENV VITE_SOKETI_HOST="${VITE_SOKETI_HOST}"
ENV VITE_SOKETI_PORT="${VITE_SOKETI_PORT}"
ENV VITE_SOKETI_USE_TLS="${VITE_SOKETI_USE_TLS}"

# Build the application
RUN pnpm run build

# Development stage
FROM node:20-alpine AS development

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Set environment variables
ENV NODE_ENV=development

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy source code (or mount at runtime)
COPY . .

# Expose development port
EXPOSE 5173

# Start development server
CMD ["pnpm", "run", "dev"]

# Production stage
FROM nginx:alpine AS production

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
