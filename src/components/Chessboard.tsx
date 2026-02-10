import React from 'react';
import { Chess } from 'chess.js';
import '../styles/Chessboard.css';

// Map chess piece types to their file names
const PIECE_TYPE_MAP: { [key: string]: string } = {
  'P': 'pawn',
  'N': 'knight',
  'B': 'bishop',
  'R': 'rook',
  'Q': 'queen',
  'K': 'king',
};

const getPieceImage = (type: string, color: string) => {
  const pieceType = PIECE_TYPE_MAP[type.toUpperCase()];
  const colorSuffix = color === 'w' ? 'w' : 'b';
  return new URL(`../assets/pieces/${pieceType}-${colorSuffix}.svg`, import.meta.url).href;
};

interface DragState {
  fromSquare: string | null;
  piece: string | null;
  touchStartX?: number;
  touchStartY?: number;
}

interface ChessboardProps {
  game: Chess;
  isDisabled: boolean;
  onMove: (moveDescription: string) => void;
  chessboardSize?: number;
}

export const Chessboard: React.FC<ChessboardProps> = ({ game, isDisabled, onMove, chessboardSize }) => {
  const [dragState, setDragState] = React.useState<DragState>({ fromSquare: null, piece: null });
  const [legalMoves, setLegalMoves] = React.useState<string[]>([]);

  const handlePieceDragStart = (e: React.DragEvent<HTMLDivElement>, square: string) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }

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
        // Call parent callback with move notation
        onMove(move.san);
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

  const handleSquareTouchStart = (square: string) => {
    if (isDisabled) return;

    const piece = game.get(square as any);
    
    // If tapping on a piece and no piece is selected, select it
    if (piece && !dragState.fromSquare) {
      // Only allow selecting pieces of the current turn color
      const isWhitePiece = piece.color === 'w';
      const isWhiteTurn = game.turn() === 'w';

      if (isWhitePiece !== isWhiteTurn) {
        return;
      }

      // Get legal moves from this square
      const moves = game.moves({ square: square as any, verbose: true });
      const legalSquares = moves.map((m: any) => m.to);

      setDragState({ fromSquare: square, piece: piece.type });
      setLegalMoves(legalSquares);
      return;
    }

    // If a piece is already selected and tapping a legal move, make the move
    if (dragState.fromSquare && legalMoves.includes(square)) {
      try {
        const move = game.move({
          from: dragState.fromSquare,
          to: square,
          promotion: 'q', // Default to queen for promotions
        });

        if (move) {
          onMove(move.san);
        }
      } catch {
        // Invalid move, silently fail
      }

      setDragState({ fromSquare: null, piece: null });
      setLegalMoves([]);
      return;
    }

    // If a piece is selected and tapping a different piece of same color, select it
    if (dragState.fromSquare && piece) {
      const isWhitePiece = piece.color === 'w';
      const isWhiteTurn = game.turn() === 'w';

      if (isWhitePiece === isWhiteTurn) {
        // Select this piece instead
        const moves = game.moves({ square: square as any, verbose: true });
        const legalSquares = moves.map((m: any) => m.to);

        setDragState({ fromSquare: square, piece: piece.type });
        setLegalMoves(legalSquares);
        return;
      }
    }

    // Otherwise, deselect
    setDragState({ fromSquare: null, piece: null });
    setLegalMoves([]);
  };

  const handlePieceTouchStart = (e: React.TouchEvent, square: string) => {
    if (isDisabled) e.preventDefault();
    
    const piece = game.get(square as any);
    
    if (!piece) return;

    // Only allow dragging pieces of the current turn color
    const isWhitePiece = piece.color === 'w';
    const isWhiteTurn = game.turn() === 'w';

    if (isWhitePiece !== isWhiteTurn) {
      return;
    }

    // Get legal moves from this square
    const moves = game.moves({ square: square as any, verbose: true });
    const legalSquares = moves.map((m: any) => m.to);

    const touch = e.touches[0];
    setDragState({ 
      fromSquare: square, 
      piece: piece.type,
      touchStartX: touch.clientX,
      touchStartY: touch.clientY
    });
    setLegalMoves(legalSquares);
  };

  const handleBoardTouchEnd = (e: React.TouchEvent) => {
    if (!dragState.fromSquare) return;

    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Find the square element
    let squareElement = element as HTMLElement | null;
    while (squareElement && !squareElement.classList.contains('square')) {
      squareElement = squareElement.parentElement;
    }

    if (!squareElement) {
      setDragState({ fromSquare: null, piece: null });
      setLegalMoves([]);
      return;
    }

    // Find the square index from the board
    const board = squareElement.closest('.board') as HTMLElement;
    if (!board) {
      setDragState({ fromSquare: null, piece: null });
      setLegalMoves([]);
      return;
    }

    const squares = Array.from(board.querySelectorAll('.square'));
    const squareIndex = squares.indexOf(squareElement);
    
    if (squareIndex === -1) {
      setDragState({ fromSquare: null, piece: null });
      setLegalMoves([]);
      return;
    }

    // Convert index to square notation (board is 8x8, 0-63)
    const rank = 7 - Math.floor(squareIndex / 8);
    const file = squareIndex % 8;
    const toSquare = String.fromCharCode(97 + file) + (rank + 1);

    if (legalMoves.includes(toSquare)) {
      try {
        const move = game.move({
          from: dragState.fromSquare,
          to: toSquare,
          promotion: 'q',
        });

        if (move) {
          onMove(move.san);
        }
      } catch {
        // Invalid move
      }
    }

    setDragState({ fromSquare: null, piece: null });
    setLegalMoves([]);
  };

  const getSquareColor = (file: number, rank: number): string => {
    return (file + rank) % 2 === 0 ? 'white' : 'black';
  };

  const resetGame = () => {
    // This function is no longer needed as reset happens at parent level
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
              <img
                className={`piece ${piece.color === 'w' ? 'white' : 'black'}`}
                src={getPieceImage(piece.type, piece.color)}
                alt={`${piece.color === 'w' ? 'white' : 'black'} ${piece.type}`}
                draggable
                onDragStart={(e) => handlePieceDragStart(e, square)}
                onTouchStart={(e) => handlePieceTouchStart(e, square)}
              />
            )}
          </div>
        );
      }
    }

    return squares;
  };

  return (
    <div 
      className={`chessboard-container ${isDisabled ? 'disabled' : ''}`}
      style={chessboardSize ? { width: chessboardSize, height: chessboardSize } : undefined}
    >
      <div className="board" onTouchEnd={handleBoardTouchEnd}>
        {renderBoard()}
      </div>
    </div>
  );
};
