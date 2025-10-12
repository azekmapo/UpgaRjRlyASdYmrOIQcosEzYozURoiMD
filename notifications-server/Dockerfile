FROM node:20-alpine AS base

WORKDIR /app

# Development stage
FROM base AS development

# Copy package files
COPY package.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Expose development port
EXPOSE 3001

# Start development server
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production

# Copy package files
COPY package.json ./

# Install dependencies (production only)
RUN npm install --production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S socketio -u 1001

# Change ownership
RUN chown -R socketio:nodejs /app
USER socketio

EXPOSE 3001

CMD ["npm", "start"]
