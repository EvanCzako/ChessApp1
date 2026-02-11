#!/usr/bin/env bash
set -e

# Ensure bin folder exists
mkdir -p ./bin

# Download Stockfish tar
curl -L -o ./bin/stockfish.tar https://github.com/official-stockfish/Stockfish/releases/download/sf_18/stockfish-ubuntu-x86-64-avx2.tar

# Extract tar into bin
tar -xf ./bin/stockfish.tar -C ./bin

# Path to the binary inside extracted folder
EXTRACTED_BINARY=./bin/stockfish/stockfish-ubuntu-x86-64-avx2
FLATTENED_BINARY=./bin/stockfish

if [ ! -f "$EXTRACTED_BINARY" ]; then
    echo "Error: Stockfish binary not found at expected path: $EXTRACTED_BINARY"
    ls -R ./bin
    exit 1
fi

# Make the extracted binary executable
chmod +x "$EXTRACTED_BINARY"

# Only move / copy if destination is different
if [ "$EXTRACTED_BINARY" != "$FLATTENED_BINARY" ]; then
    cp "$EXTRACTED_BINARY" "$FLATTENED_BINARY"
fi

# Make the flattened binary executable too
chmod +x "$FLATTENED_BINARY"

# Clean up tar
rm ./bin/stockfish.tar

echo "Stockfish installed to $FLATTENED_BINARY"
