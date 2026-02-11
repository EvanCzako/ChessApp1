# create bin folder
mkdir -p ./bin

echo "Building Stockfish (generic x86-64) ..."

# clone shallow for speed
git clone --depth 1 https://github.com/official-stockfish/Stockfish.git ./stockfish-src

cd ./stockfish-src/src

# build MOST compatible version (no AVX/AVX2)
make build ARCH=x86-64

# move compiled binary to your backend bin
mv stockfish ../../bin/stockfish

cd ../../

# cleanup source to keep deploy small
rm -rf ./stockfish-src

# ensure executable
chmod 755 ./bin/stockfish

ls -l ./bin/stockfish
echo "Stockfish compiled and installed to ./bin/stockfish"
