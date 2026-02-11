#!/usr/bin/env bash
set -e

mkdir -p ../bin

# Download Linux Stockfish zip
curl -L https://stockfishchess.org/files/stockfish-15.1-linux-x64-bmi2.zip -o sf.zip

# Unzip into bin folder
unzip -o sf.zip -d ../bin

# Make executable (binary inside the zip is usually named 'stockfish-15.1-linux-x64-bmi2')
chmod +x ../bin/stockfish-15.1-linux-x64-bmi2

# Optionally, rename to simple 'stockfish' for easier path reference
mv ../bin/stockfish-15.1-linux-x64-bmi2 ../bin/stockfish

# Clean up
rm sf.zip
