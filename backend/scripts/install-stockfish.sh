#!/usr/bin/env bash
set -e

# Make sure bin exists
mkdir -p ./bin

# Download Stockfish tar
curl -L -o ./bin/stockfish.tar https://github.com/official-stockfish/Stockfish/releases/download/sf_18/stockfish-ubuntu-x86-64-avx2.tar

# Extract tar into bin
tar -xf ./bin/stockfish.tar -C ./bin

# Find the binary
EXTRACTED_BINARY=$(find ./bin -type f -name "stockfish" | head -n 1)

if [ -z "$EXTRACTED_BINARY" ]; then
  echo "Error: Could not find extracted Stockfish binary"
  exit 1
fi

# Make it executable
chmod +x "$EXTRACTED_BINARY"

# Copy it to a flat path
cp "$EXTRACTED_BINARY" ./bin/stockfish

# Clean up tar
rm ./bin/stockfish.tar

echo "Stockfish installed to ./bin/stockfish"
