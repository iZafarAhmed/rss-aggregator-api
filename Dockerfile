# RSS Aggregator API - Dockerfile for Cloud Run
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Expose port
ENV PORT=8080

# Start server
CMD ["node", "server.js"]
