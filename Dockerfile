# Use LTS Node
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install only production deps (good for production)
RUN npm ci --omit=dev

# Copy the rest of the code
COPY . .

# If your app builds (TypeScript/Next/etc), do it here:
# RUN npm run build

# Your app should listen on this port (example 3000)
EXPOSE 3000

# Start command (adjust if needed)
CMD ["npm", "start"]
