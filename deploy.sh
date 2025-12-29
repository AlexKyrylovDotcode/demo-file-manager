#!/bin/bash

# Deployment script for Next.js application
# This script pulls latest changes, installs dependencies, builds, and restarts PM2

set -e  # Exit on any error

echo "🚀 Starting deployment..."

echo "Pulling latest changes from git..."
git pull

echo "Installing dependencies..."
npm install

echo "Building application..."
npm run build

echo "Restarting PM2 process..."
pm2 restart next-app

echo "Deployment completed successfully!"

