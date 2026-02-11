#!/usr/bin/env bash
set -e

# Ensure bin folder exists
mkdir -p ../bin

# Download Stockfish Linux tar (direct GitHub release)
curl -L -o ../bin/stockfish.tar https://github.com/official-stockfish/Stockfish/releases/download/sf_18/stockfish-ubuntu-x86-64-avx2.tar

# Extract tar into bin folder
tar -xf ../bin/stockfish.tar -C ../bin

# Find the extracted binary (it may be nested in a folder)
EXTRACTED_BINARY=$(find ../bin -type f -name "stockfish-ubuntu-x86-64-avx2" | head -n 1)

if [ -z "$EXTRACTED_BINARY" ]; then
  echo "Error: Could not find extracted Stockfish binary"
  exit 1
fi

# Make it executable
chmod +x "$EXTRACTED_BINARY"

# Rename to simple 'stockfish' for consistent backend path
mv "$EXTRACTED_BINARY" ../bin/stockfish

# Clean up tar
rm ../bin/stockfish.tar

echo "Stockfish installed to ../bin/stockfish"
