import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import '../styles/Chessboard.css';

const PIECE_UNICODE: { [key: string]: string } = {
  'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔',
  'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚',
};

interface DragState {
  fromSquare: string | null;
  piece: string | null;
}

export const Chessboard: React.FC = () => {
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [dragState, setDragState] = useState<DragState>({ fromSquare: null, piece: null });
  const [legalMoves, setLegalMoves] = useState<string[]>([]);

  useEffect(() => {
    // Reset game on component mount
    const newGame = new Chess();
    setGame(newGame);
  }, []);

  const handlePieceDragStart = (e: React.DragEvent<HTMLDivElement>, square: string) => {
    const piece = game.get(square as any);
    
    if (!piece) {
      e.preventDefault();
      return;
    }

    // Only allow dragging pieces of the current turn color
    const isWhitePiece = piece.color === 'w';
    const isWhiteTurn = game.turn() === 'w';

    if (isWhitePiece !== isWhiteTurn) {
      e.preventDefault();
      return;
    }

    // Get legal moves from this square
    const moves = game.moves({ square: square as any, verbose: true });
    const legalSquares = moves.map((m: any) => m.to);

    setDragState({ fromSquare: square, piece: piece.type });
    setLegalMoves(legalSquares);

    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSquareDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleSquareDrop = (e: React.DragEvent<HTMLDivElement>, toSquare: string) => {
    e.preventDefault();

    if (!dragState.fromSquare) return;

    try {
      const move = game.move({
        from: dragState.fromSquare,
        to: toSquare,
        promotion: 'q', // Default to queen for promotions
      });

      if (move) {
        // Move was successful, create new game state to trigger re-render
        const newGame = new Chess(game.fen());
        setGame(newGame);
      }
    } catch {
      // Invalid move, silently fail
    }

    setDragState({ fromSquare: null, piece: null });
    setLegalMoves([]);
  };

  const handleSquareDragLeave = () => {
    // Optional: Add visual feedback
  };

  const getSquareColor = (file: number, rank: number): string => {
    return (file + rank) % 2 === 0 ? 'white' : 'black';
  };

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setDragState({ fromSquare: null, piece: null });
    setLegalMoves([]);
  };

  const renderBoard = () => {
    const squares = [];

    for (let rank = 7; rank >= 0; rank--) {
      for (let file = 0; file < 8; file++) {
        const fileChar = String.fromCharCode(97 + file); // a-h
        const square = `${fileChar}${rank + 1}`;
        const piece = game.get(square as any);
        const squareColor = getSquareColor(file, rank);
        const isFromSquare = dragState.fromSquare === square;
        const isLegalMove = legalMoves.includes(square);

        squares.push(
          <div
            key={square}
            className={`square ${squareColor} ${isFromSquare ? 'dragging-from' : ''} ${
              isLegalMove ? 'legal-move' : ''
            }`}
            onDragOver={handleSquareDragOver}
            onDrop={(e) => handleSquareDrop(e, square)}
            onDragLeave={handleSquareDragLeave}
          >
            {piece && (
              <div
                className={`piece ${piece.color === 'w' ? 'white' : 'black'}`}
                draggable
                onDragStart={(e) => handlePieceDragStart(e, square)}
              >
                {PIECE_UNICODE[piece.type.toUpperCase() as keyof typeof PIECE_UNICODE]}
              </div>
            )}
          </div>
        );
      }
    }

    return squares;
  };

  return (
    <div className="chessboard-container">
      <div className="board">
        {renderBoard()}
      </div>
      <div className="controls">
        <button onClick={resetGame} className="reset-btn">
          New Game
        </button>
        <div className="game-info">
          <p>Turn: <strong>{game.turn() === 'w' ? 'White' : 'Black'}</strong></p>
          <p>FEN: <code>{game.fen()}</code></p>
        </div>
      </div>
    </div>
  );
};
