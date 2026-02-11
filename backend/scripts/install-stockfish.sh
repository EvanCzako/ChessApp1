#!/usr/bin/env bash
set -e

# Make sure bin folder exists
mkdir -p ../bin

# Download Stockfish Linux binary (direct link)
curl -L -o ../bin/stockfish.tar https://github.com/official-stockfish/Stockfish/releases/download/sf_18/stockfish-ubuntu-x86-64-avx2.tar

# Extract the tar into the bin folder
tar -xf ../bin/stockfish.tar -C ../bin

# The tar usually contains a file named 'stockfish-ubuntu-x86-64-avx2'
# Make it executable
chmod +x ../bin/stockfish-ubuntu-x86-64-avx2

# Rename to simple 'stockfish' for your backend paths
mv ../bin/stockfish-ubuntu-x86-64-avx2 ../bin/stockfish

# Clean up
rm ../bin/stockfish.tar

echo "Stockfish installed to ../bin/stockfish"
