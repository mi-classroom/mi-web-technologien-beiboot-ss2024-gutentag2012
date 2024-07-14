# Use the official Node.js image as the base image
FROM node:22-alpine

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm i -g pnpm
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Expose port (if needed, adjust based on your application)
EXPOSE 3001

RUN pnpm build

# Start the Nest.js application
CMD ["pnpm", "start"]
