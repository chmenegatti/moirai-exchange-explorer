# Multi-stage build for Frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm install

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Main image for Backend + Frontend
FROM node:22-alpine

WORKDIR /app

# Install mermaid-cli dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    wget

# Set environment variable for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage"

# Copy backend package files
COPY package*.json ./

# Install backend dependencies (including mermaid-cli globally)
RUN npm install --production && \
    npm install -g @mermaid-js/mermaid-cli

# Copy backend source
COPY . .

# Copy Puppeteer config for mermaid-cli
COPY puppeteer-config.json /app/puppeteer-config.json

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create necessary directories with proper permissions
RUN mkdir -p ./json ./output ./logs && \
    chmod -R 777 ./json ./output ./logs

# Expose ports
EXPOSE 3000 9200

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Starting Backend API on port 3000..."' >> /app/start.sh && \
    echo 'node src/server.js &' >> /app/start.sh && \
    echo 'BACKEND_PID=$!' >> /app/start.sh && \
    echo 'echo "Backend started with PID: $BACKEND_PID"' >> /app/start.sh && \
    echo 'echo "Starting Frontend server on port 9200..."' >> /app/start.sh && \
    echo 'cd /app/frontend/dist && npx serve -s . -l 9200 &' >> /app/start.sh && \
    echo 'FRONTEND_PID=$!' >> /app/start.sh && \
    echo 'echo "Frontend started with PID: $FRONTEND_PID"' >> /app/start.sh && \
    echo 'echo "Application ready!"' >> /app/start.sh && \
    echo 'wait $BACKEND_PID $FRONTEND_PID' >> /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/app/start.sh"]
