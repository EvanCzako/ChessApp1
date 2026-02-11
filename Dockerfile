FROM node:18-slim

# Install Stockfish engine
RUN apt-get update && apt-get install -y --no-install-recommends stockfish && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy all root files needed for build
COPY package*.json vite.config.ts tsconfig*.json ./
COPY index.html ./

# Install root dependencies
RUN npm install

# Copy source code
COPY src ./src
COPY public ./public

# Copy backend
COPY backend ./backend

WORKDIR /app/backend
RUN npm install

WORKDIR /app

# Build frontend
RUN npm run build

# Expose ports
EXPOSE 3001 5173

# Start backend (which will serve static files)
CMD ["node", "backend/index.js"]
