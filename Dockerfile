FROM node:18-alpine

WORKDIR /app

# Install curl for health checks and data updates
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY server.js ./
COPY scripts/ ./scripts/
COPY data/ ./data/
COPY public/ ./public/

# Create gallery directory with proper permissions
RUN mkdir -p /app/gallery && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start application
CMD ["node", "server.js"]
