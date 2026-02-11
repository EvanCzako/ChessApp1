#!/usr/bin/env bash
mkdir -p bin
curl -L https://stockfishchess.org/files/stockfish-ubuntu-x86-64.tar -o sf.tar
tar -xf sf.tar -C bin
chmod +x bin/stockfish
