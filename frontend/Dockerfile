# Use the official Node.js image as the base image
FROM node:22-alpine

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Install dependencies
RUN npm i -g pnpm
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Set environment variables at build time
ARG NEXT_PUBLIC_API_URL
ARG SERVER_API_URL
ARG NEXT_PUBLIC_MAX_FILE_SIZE
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV SERVER_API_URL=$SERVER_API_URL
ENV NEXT_PUBLIC_MAX_FILE_SIZE=$NEXT_PUBLIC_MAX_FILE_SIZE

# Build the Next.js application
RUN pnpm run build

# Expose the port that Next.js will run on
EXPOSE 3000

# Start the Next.js application
CMD ["pnpm", "start"]
