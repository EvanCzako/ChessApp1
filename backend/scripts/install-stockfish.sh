#!/usr/bin/env bash
set -e

mkdir -p ../bin

# Download Stockfish Linux zip (direct link)
curl -L https://github.com/official-stockfish/Stockfish/releases/download/sf_15.1/stockfish_15.1_linux_x64_bmi2.zip -o sf.zip

# Unzip into bin folder
unzip -o sf.zip -d ../bin

# The executable inside the zip
chmod +x ../bin/stockfish_15.1_linux_x64_bmi2

# Rename to 'stockfish' for simplicity
mv ../bin/stockfish_15.1_linux_x64_bmi2 ../bin/stockfish

# Clean up
rm sf.zip

echo "Stockfish installed to ../bin/stockfish"
