#!/usr/bin/env bash
set -e

mkdir -p ../bin

# Download Stockfish tar
curl -L -o ../bin/stockfish.tar https://github.com/official-stockfish/Stockfish/releases/download/sf_18/stockfish-ubuntu-x86-64-avx2.tar

# Extract tar into bin
tar -xf ../bin/stockfish.tar -C ../bin

# Remove old flat stockfish file if exists
rm -f ../bin/stockfish

# Find the first executable file in ../bin
EXTRACTED_BINARY=$(find ../bin -type f -perm /111 | head -n 1)

if [ -z "$EXTRACTED_BINARY" ]; then
  echo "Error: Could not find extracted Stockfish binary"
  exit 1
fi

# Make it executable
chmod +x "$EXTRACTED_BINARY"

# Copy to known path
cp "$EXTRACTED_BINARY" ../bin/stockfish

# Clean up
rm ../bin/stockfish.tar

echo "Stockfish installed to ../bin/stockfish"
