# Use the official Nginx image as base
FROM nginx:alpine

# Copy the static files to Nginx's default public directory
COPY app/public /usr/share/nginx/html

# Copy custom Nginx configuration (we'll create this next)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]