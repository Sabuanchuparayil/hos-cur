# Backend Dockerfile for House of Spells API
FROM node:22-alpine

WORKDIR /app

# Install dependencies for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install ALL dependencies (including prisma CLI)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY backend/src ./src

# Start the server
CMD ["npm", "start"]
