#!/usr/bin/env bash
set -e

mkdir -p ./bin

# Download tar
curl -L -o ./bin/stockfish.tar https://github.com/official-stockfish/Stockfish/releases/download/sf_18/stockfish-ubuntu-x86-64-avx2.tar

# Extract tar
tar -xf ./bin/stockfish.tar -C ./bin

# The binary inside tar
EXTRACTED_BINARY=./bin/stockfish/stockfish-ubuntu-x86-64-avx2

if [ ! -f "$EXTRACTED_BINARY" ]; then
    echo "Error: Stockfish binary not found at expected path: $EXTRACTED_BINARY"
    ls -R ./bin
    exit 1
fi

chmod +x "$EXTRACTED_BINARY"

# Copy to flat path
cp "$EXTRACTED_BINARY" ./bin/stockfish

# Clean up
rm ./bin/stockfish.tar

echo "Stockfish installed to ./bin/stockfish"
