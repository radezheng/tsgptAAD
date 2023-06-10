# Use the official Node.js 16 image as the base image
FROM node:16 AS builder

# Set the working directory to /app
WORKDIR /app

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Build the application
RUN npm run build

# Use the official Nginx image as the base image
FROM nginx:stable

# Copy the Nginx configuration file to the container
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the built application to the Nginx container
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/dist /app/server/dist

# Copy the server file to the container
COPY server/ /app/server


RUN apt-get update && apt-get install -y curl xz-utils
RUN curl -sL https://nodejs.org/dist/v18.9.1/node-v18.9.1-linux-x64.tar.xz | tar -xJ -C /usr/local --strip-components=1

RUN apt-get install -y npm
RUN cd /app/server &&  npm install
# Expose the ports that the application will run on
EXPOSE 80 3000

# Start the server and the application
CMD ["sh", "-c", "cd /app/server && node index.mjs & nginx -g 'daemon off;'"]