import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import { Chess } from 'chess.js';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

let stockfish = null;
let isReady = false;

app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Serve static files from the frontend build
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Get Stockfish executable path based on platform
function getStockfishPath() {
  const platform = os.platform();
  const projectRoot = path.join(__dirname, '..');
  
  if (platform === 'win32') {
    // Windows - try project stockfish folder with specific executable name, then common paths
    const winPaths = [
      path.join(projectRoot, 'stockfish', 'stockfish-windows.exe'),
      path.join(projectRoot, 'stockfish', 'stockfish-windows-x86-64-avx2.exe'),
      path.join(projectRoot, 'stockfish', 'stockfish.exe'),
      path.join(projectRoot, 'stockfish', 'stockfish'),
      'C:\\Code\\stockfish\\stockfish-windows.exe',
      'C:\\Program Files\\stockfish\\stockfish.exe',
      'C:\\Program Files (x86)\\stockfish\\stockfish.exe',
      'stockfish' // Try from PATH
    ];
    
    for (const p of winPaths) {
      if (p !== 'stockfish') {
        try {
          fs.accessSync(p);
          console.log(`Found Stockfish at: ${p}`);
          return p;
        } catch (e) {
          // Continue to next path
        }
      }
    }
    
    return 'stockfish'; // Fall back to PATH
  } else if (platform === 'darwin') {
    // macOS - try project stockfish folder first
    const macPaths = [
      path.join(projectRoot, 'stockfish', 'stockfish'),
      '/usr/local/bin/stockfish',
      '/opt/homebrew/bin/stockfish'
    ];
    
    for (const p of macPaths) {
      try {
        fs.accessSync(p);
        console.log(`Found Stockfish at: ${p}`);
        return p;
      } catch (e) {
        // Continue to next path
      }
    }
    
    return 'stockfish'; // Fall back to PATH
  } else {
    // Linux - try project stockfish folder first, then common installation paths
    const linuxPaths = [
      path.join(projectRoot, 'stockfish', 'stockfish'),
      '/usr/games/stockfish',
      '/usr/bin/stockfish',
      '/usr/local/bin/stockfish'
    ];
    
    for (const p of linuxPaths) {
      try {
        fs.accessSync(p);
        console.log(`Found Stockfish at: ${p}`);
        return p;
      } catch (e) {
        // Path doesn't exist, try next one
      }
    }
    
    return 'stockfish'; // Fall back to PATH
  }
}

// Initialize Stockfish process
function initStockfish() {
  if (stockfish) {
    try {
      stockfish.kill();
    } catch (e) {
      // Already dead
    }
  }

  const stockfishPath = getStockfishPath();
  console.log(`Attempting to start Stockfish from: ${stockfishPath}`);
  
  // Spawn Stockfish process
  stockfish = spawn(stockfishPath, {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let buffer = '';
  let initialized = false;

  stockfish.stdout.on('data', (data) => {
    buffer += data.toString();
  });

  stockfish.stderr.on('data', (data) => {
    console.error(`Stockfish stderr: ${data}`);
  });

  stockfish.on('error', (error) => {
    console.error(`Failed to start Stockfish: ${error.message}`);
    isReady = false;
  });

  stockfish.on('close', (code) => {
    console.log(`Stockfish process exited with code ${code}`);
    isReady = false;
  });

  // Send UCI command and wait for initialization
  return new Promise((resolve) => {
    const checkReady = setInterval(() => {
      if (buffer.includes('uciok')) {
        clearInterval(checkReady);
        if (!initialized) {
          initialized = true;
          isReady = true;
          console.log('Stockfish initialized successfully');
          // Set MultiPV option
          try {
            stockfish.stdin.write('setoption name MultiPV value 5\n');
          } catch (e) {
            console.error('Error setting MultiPV option:', e);
          }
        }
        resolve();
      }
    }, 100);

    try {
      stockfish.stdin.write('uci\n');
      stockfish.stdin.write('isready\n');
    } catch (e) {
      console.error('Error writing to Stockfish:', e);
      isReady = false;
      clearInterval(checkReady);
      resolve();
    }

    setTimeout(() => {
      clearInterval(checkReady);
      if (!initialized) {
        console.warn('Stockfish initialization timeout after 5 seconds');
        isReady = false;
      }
      resolve();
    }, 5000);
  });
}

// Send command to Stockfish
function sendToStockfish(command) {
  return new Promise((resolve) => {
    if (!stockfish) {
      resolve('Error: Stockfish not initialized');
      return;
    }

    let resultBuffer = '';
    const dataHandler = (data) => {
      resultBuffer += data.toString();
    };

    stockfish.stdout.once('data', dataHandler);
    stockfish.stdin.write(command + '\n');

    setTimeout(() => {
      stockfish.stdout.removeListener('data', dataHandler);
      resolve(resultBuffer);
    }, 100);
  });
}

// Evaluate position endpoint
app.post('/api/evaluate', async (req, res) => {
  try {
    const { fen, depth = 15, moves: requestedMoves } = req.body;

    if (!fen) {
      return res.status(400).json({ error: 'FEN position is required' });
    }

    if (!isReady) {
      console.warn('Stockfish not ready, returning default evaluations for', requestedMoves?.length || 0, 'moves');
      
      // Return default evaluations when Stockfish is not available
      if (requestedMoves && Array.isArray(requestedMoves) && requestedMoves.length > 0) {
        const evaluations = requestedMoves.map((move) => ({
          move,
          evaluation: 0
        }));
        
        return res.json({
          fen,
          topMoves: evaluations.map((e, idx) => ({
            rank: idx + 1,
            move: e.move,
            evaluation: e.evaluation
          }))
        });
      } else {
        return res.json({
          fen,
          topMoves: [],
          warning: 'Stockfish is not available'
        });
      }
    }

    // Determine whose turn it is in the current position
    const isBlackToMove = fen.split(' ')[1] === 'b';

    // If specific moves are provided, evaluate each one individually
    if (requestedMoves && Array.isArray(requestedMoves) && requestedMoves.length > 0) {
      const evaluations = [];

      for (const moveNotation of requestedMoves) {
        try {
          const tempGame = new Chess(fen);
          const move = tempGame.move(moveNotation);
          if (!move) {
            evaluations.push({ move: moveNotation, evaluation: 0 });
            continue;
          }

          const newFen = tempGame.fen();

          // Evaluate the resulting position
          await sendToStockfish(`position fen ${newFen}`);

          const evalPromise = new Promise((resolve) => {
            let buffer = '';
            const dataHandler = (data) => {
              buffer += data.toString();
              if (buffer.includes('bestmove')) {
                stockfish.stdout.removeListener('data', dataHandler);
                resolve(buffer);
              }
            };

            stockfish.stdout.on('data', dataHandler);
            stockfish.stdin.write(`go depth ${depth} movetime 1000\n`);

            setTimeout(() => {
              stockfish.stdout.removeListener('data', dataHandler);
              resolve(buffer);
            }, 5000);
          });

          const evalOutput = await evalPromise;
          const lines = evalOutput.split('\n');
          
          // Find the best evaluation from the analysis
          let bestEval = 0;
          let isMate = false;
          
          for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].includes('info')) {
              // Check for mate score
              const mateMatch = lines[i].match(/mate (-?\d+)/);
              if (mateMatch) {
                const mateIn = parseInt(mateMatch[1]);
                bestEval = mateIn > 0 ? 999 : -999;
                isMate = true;
                break;
              }
              // Check for centipawn score
              const cpMatch = lines[i].match(/cp (-?\d+)/);
              if (cpMatch && !isMate) {
                bestEval = parseInt(cpMatch[1]) / 100;
              }
            }
          }

          // Negate evaluation to convert from the position's perspective (side to move)
          // to the side that made the move's perspective (the side choosing between moves)
          const evaluation = -bestEval;
          
          evaluations.push({ move: moveNotation, evaluation });
        } catch (error) {
          console.error(`Error evaluating move ${moveNotation}:`, error);
          evaluations.push({ move: moveNotation, evaluation: 0 });
        }
      }

      res.json({
        fen,
        topMoves: evaluations.map((e, idx) => ({
          rank: idx + 1,
          move: e.move,
          evaluation: e.evaluation
        }))
      });
    } else {
      // Original multipv analysis for top 5 moves
      // Set position and analyze
      await sendToStockfish(`position fen ${fen}`);

      // Go command with depth and multipv for top moves
      const analysisPromise = new Promise((resolve) => {
        let buffer = '';
        const dataHandler = (data) => {
          buffer += data.toString();
          if (buffer.includes('bestmove')) {
            stockfish.stdout.removeListener('data', dataHandler);
            resolve(buffer);
          }
        };

        stockfish.stdout.on('data', dataHandler);
        stockfish.stdin.write(`go depth ${depth} multipv 5 movetime 2000\n`);

        setTimeout(() => {
          stockfish.stdout.removeListener('data', dataHandler);
          resolve(buffer);
        }, 10000);
      });

      const analysis = await analysisPromise;

      // Parse the last "info" line to get evaluation
      const lines = analysis.split('\n');
      let evaluation = null;
      let bestMove = null;
      const topMoves = [];

      // Parse all info lines to collect top 5 moves
      const infoLines = lines.filter(line => line.includes('info') && line.includes('multipv'));
      const mvMap = new Map();

      for (const line of infoLines) {
        const mvMatch = line.match(/multipv (\d+)/);
        const cpMatch = line.match(/cp (-?\d+)/);
        const depthMatch = line.match(/depth (\d+)/);
        
        if (mvMatch && cpMatch) {
          const mvNum = parseInt(mvMatch[1]);
          const eval_score = parseInt(cpMatch[1]) / 100;
          const depth = depthMatch ? parseInt(depthMatch[1]) : 0;
          
          // Extract move from pv section - find everything after "pv "
          const pvMatch = line.match(/\bpv\s+(\S+)/);
          const uciMove = pvMatch ? pvMatch[1] : '';
          
          // Convert UCI move to SAN notation
          let sanMove = uciMove;
          if (uciMove) {
            try {
              const tempGame = new Chess(fen);
              const move = tempGame.move({
                from: uciMove.substring(0, 2),
                to: uciMove.substring(2, 4),
                promotion: uciMove.length > 4 ? uciMove[4] : undefined
              });
              if (move) {
                sanMove = move.san;
              }
            } catch (e) {
              console.error(`Failed to convert UCI move ${uciMove} to SAN:`, e);
            }
          }
          
          if (sanMove && (!mvMap.has(mvNum) || mvMap.get(mvNum).depth < depth)) {
            mvMap.set(mvNum, { 
              evaluation: eval_score, 
              move: sanMove, 
              depth: depth 
            });
          }
        }
      }

      // Convert map to sorted array
      for (let i = 1; i <= 5; i++) {
        if (mvMap.has(i)) {
          const moveData = mvMap.get(i);
          topMoves.push({
            rank: i,
            move: moveData.move,
            evaluation: moveData.evaluation
          });
        }
      }

      // Get best move from bestmove line
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].includes('bestmove')) {
          const parts = lines[i].split(' ');
          bestMove = parts[1];
          break;
        }
      }

      // Get evaluation from best move
      if (topMoves.length > 0) {
        evaluation = topMoves[0].evaluation;
      }

      res.json({
        fen,
        evaluation,
        bestMove,
        topMoves,
        depth,
        analysis
      });
    }
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ error: 'Failed to evaluate position' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: isReady ? 'ready' : 'initializing' });
});

// Catch-all route for SPA - serve index.html for any unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Not found');
    }
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Initializing Stockfish...');
  await initStockfish();
});
