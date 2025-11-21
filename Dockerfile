# ---------- Build Stage ----------
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---------- Serve Stage ----------
FROM node:22-alpine

WORKDIR /app
RUN npm install -g serve

# Copy built assets from build stage
COPY --from=build /app/dist /app/dist

EXPOSE 5173
CMD ["serve", "-s", "/app/dist", "-l", "5173"]
