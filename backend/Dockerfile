# Backend Dockerfile for House of Spells API
FROM node:22-alpine

WORKDIR /app

# Install dependencies for Prisma and healthcheck
RUN apk add --no-cache openssl wget

# Copy package files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install ALL dependencies (including prisma CLI)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY backend/src ./src

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the server
CMD ["npm", "start"]

