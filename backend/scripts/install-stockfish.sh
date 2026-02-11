#!/usr/bin/env bash
set -e

# Ensure bin folder exists
mkdir -p ../bin

# Download Stockfish tar
curl -L -o ../bin/stockfish.tar https://github.com/official-stockfish/Stockfish/releases/download/sf_18/stockfish-ubuntu-x86-64-avx2.tar

# Extract tar into bin
tar -xf ../bin/stockfish.tar -C ../bin

# Remove old stockfish file if it exists (file or directory)
if [ -e ../bin/stockfish ]; then
  rm -rf ../bin/stockfish
fi

# Find the first executable inside ../bin
EXTRACTED_BINARY=$(find ../bin -type f -perm /111 | head -n 1)

if [ -z "$EXTRACTED_BINARY" ]; then
  echo "Error: Could not find extracted Stockfish binary"
  exit 1
fi

# Make it executable
chmod +x "$EXTRACTED_BINARY"

# Copy it to ../bin/stockfish
cp "$EXTRACTED_BINARY" ../bin/stockfish

# Clean up tar
rm ../bin/stockfish.tar

echo "Stockfish installed to ../bin/stockfish"
