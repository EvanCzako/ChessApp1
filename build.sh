#!/bin/bash
set -e

echo "Installing Stockfish..."
apt-get update
apt-get install -y stockfish

echo "Installing dependencies..."
npm install --production=false

echo "Installing backend dependencies..."
cd backend
npm install
cd ..

echo "Building frontend..."
npm run build

echo "Build complete!"
