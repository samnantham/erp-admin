# Use a lightweight Nginx image
FROM nginx:alpine

# Copy the built React (Vite) app to Nginx's serving directory
COPY dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
