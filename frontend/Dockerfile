# Stage 1: Build React/Vite app
FROM node:20-alpine AS build
WORKDIR /app

# Copy package definitions
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source code
COPY . .

# Build-time environment variables
ARG VITE_API_BASE_URL=http://localhost:8080
ARG VITE_USE_MOCK=true
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_USE_MOCK=$VITE_USE_MOCK

# Build production bundle
RUN npm run build

# Stage 2: Production runtime with Nginx
FROM nginx:alpine AS runtime
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy built assets and custom nginx configuration
COPY --from=build /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
