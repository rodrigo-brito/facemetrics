# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Download face-api.js models
RUN node scripts/download-models.js

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy the built assets
COPY --from=build /app/dist /usr/share/nginx/html/facemetrics

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"] 