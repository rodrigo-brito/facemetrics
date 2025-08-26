FROM nginx:alpine

# Create directory for the app
RUN mkdir -p /usr/share/nginx/html/facemetrics

# Copy the built assets (run npm run build before docker build)
COPY dist/ /usr/share/nginx/html/facemetrics/

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"] 