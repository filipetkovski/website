# Build stage
FROM node:22-slim AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm install

ARG VITE_APIKEY
ARG VITE_AUTHDOMAIN
ARG VITE_PROJECTID
ARG VITE_STORAGEBUCKET
ARG VITE_MESSAGINGSENDERID
ARG VITE_APPID
ARG VITE_FIRESTOREDATABASEID

# Set them as ENV so 'npm run build' (Vite) can inject them into the JS files
ENV VITE_APIKEY=$VITE_APIKEY
ENV VITE_AUTHDOMAIN=$VITE_AUTHDOMAIN
ENV VITE_PROJECTID=$VITE_PROJECTID
ENV VITE_STORAGEBUCKET=$VITE_STORAGEBUCKET
ENV VITE_MESSAGINGSENDERID=$VITE_MESSAGINGSENDERID
ENV VITE_APPID=$VITE_APPID
ENV VITE_FIRESTOREDATABASEID=$VITE_FIRESTOREDATABASEID

# Copy source files
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:22-slim

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the built assets from the build stage
COPY --from=build /app/dist ./dist

# Copy the server entry point (and any other necessary files)
COPY server.ts ./

# Expose the port (Cloud Run will inject PORT env var, but 3000 is our default)
EXPOSE 3000

# Start the server using the npm script which we updated to include the flag
CMD ["npm", "start"]
