# ============================================
# STAGE 1: Build Stage
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source code
COPY . .

# ============================================
# STAGE 2: Production Stage
# ============================================
FROM node:20-alpine

# Install tini for proper signal handling
RUN apk add --no-cache tini curl

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/storage ./storage
COPY --from=builder --chown=nodejs:nodejs /app/db ./db

# Create necessary directories
RUN mkdir -p /app/temp/uploads && \
    mkdir -p /app/storage/knowledge-bases && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 8000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/index.js"]