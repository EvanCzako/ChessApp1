mkdir -p ./bin

# Download tar
curl -L -o ./bin/stockfish.tar https://github.com/official-stockfish/Stockfish/releases/download/sf_18/stockfish-ubuntu-x86-64-avx2.tar

# Extract tar
tar -xf ./bin/stockfish.tar -C ./bin

# Path to the binary inside extracted folder
EXTRACTED_BINARY=./bin/stockfish/stockfish-ubuntu-x86-64-avx2

if [ ! -f "$EXTRACTED_BINARY" ]; then
    echo "Error: Stockfish binary not found at expected path: $EXTRACTED_BINARY"
    ls -R ./bin
    exit 1
fi

# Make it executable
chmod +x "$EXTRACTED_BINARY"

# Copy / rename to a flat, consistent name
cp "$EXTRACTED_BINARY" ./bin/stockfish

ls -l ./bin/stockfish

# Clean up tar
rm ./bin/stockfish.tar

echo "Stockfish installed to ./bin/stockfish"
