#!/bin/bash

# Exit on error
set -e

# Install dependencies
npm install

# Build client and server
npm run build:client
npm run build:server

# Print success message
echo "Build completed successfully!" 