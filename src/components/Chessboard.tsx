import React from 'react';
import { Chess } from 'chess.js';
import { PromotionDialog } from './PromotionDialog';
import { detectGameStatus } from '../utils/drawDetection';
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
  pieceColor?: 'w' | 'b';
  cursorX?: number;
  cursorY?: number;
  touchStartX?: number;
  touchStartY?: number;
}

interface ChessboardProps {
  game: Chess;
  isDisabled: boolean;
  onMove: (moveDescription: string) => void;
  chessboardSize?: number;
  playerColor?: 'white' | 'black';
  gameResetSignal: number;
}

export const Chessboard: React.FC<ChessboardProps> = ({ game, isDisabled, onMove, chessboardSize, playerColor = 'white', gameResetSignal }) => {
  const [dragState, setDragState] = React.useState<DragState>({ fromSquare: null, piece: null });
  const [legalMoves, setLegalMoves] = React.useState<string[]>([]);
  const [promotionPending, setPromotionPending] = React.useState<{ fromSquare: string; toSquare: string; pawnColor: 'white' | 'black' } | null>(null);
  const boardRef = React.useRef<HTMLDivElement>(null);

  // Close promotion dialog when game is reset
  React.useEffect(() => {
    setPromotionPending(null);
  }, [gameResetSignal]);

  const isPromotionMove = (fromSquare: string, toSquare: string): boolean => {
    const piece = game.get(fromSquare as any);
    if (!piece || piece.type !== 'p') return false;
    // White pawn moving to rank 8, or black pawn moving to rank 1
    const toRank = parseInt(toSquare[1]);
    return (piece.color === 'w' && toRank === 8) || (piece.color === 'b' && toRank === 1);
  };

  const executeMove = (fromSquare: string, toSquare: string, promotion?: 'q' | 'r' | 'b' | 'n') => {
    try {
      const move = game.move({
        from: fromSquare,
        to: toSquare,
        ...(promotion && { promotion }),
      });

      if (move) {
        // Check game status after move to add appropriate notation
        const gameStatus = detectGameStatus(game);
        let moveNotation = move.san;
        
        // Append game-ending notation
        if (gameStatus.isGameOver) {
          if (gameStatus.reason === 'checkmate') {
            // chess.js already adds # for checkmate, but ensure it's present
            if (!moveNotation.includes('#')) {
              moveNotation += '#';
            }
          } else if (gameStatus.reason === 'stalemate') {
            moveNotation += ' ½-½';
          } else if (gameStatus.reason === 'repetition' || gameStatus.reason === 'move-rule-50' || gameStatus.reason === 'insufficient-material') {
            moveNotation += ' ½-½';
          }
        }
        
        onMove(moveNotation);
      }
    } catch {
      // Invalid move, silently fail
    }

    setDragState({ fromSquare: null, piece: null });
    setLegalMoves([]);
  };

  const handlePromotionSelect = (promotion: 'q' | 'r' | 'b' | 'n') => {
    if (!promotionPending) return;

    executeMove(promotionPending.fromSquare, promotionPending.toSquare, promotion);
    setPromotionPending(null);
  };

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

    setDragState({ 
      fromSquare: square, 
      piece: piece.type,
      pieceColor: piece.color,
      cursorX: e.clientX,
      cursorY: e.clientY 
    });
    setLegalMoves(legalSquares);

    e.dataTransfer.effectAllowed = 'move';
    // Create a transparent drag image to hide the default browser drag image
    const emptyImage = new Image();
    e.dataTransfer.setDragImage(emptyImage, 0, 0);
  };

  const handleSquareDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Update drag state with current cursor position
    setDragState(prev => ({ 
      ...prev, 
      cursorX: e.clientX, 
      cursorY: e.clientY 
    }));
  };

  const handleSquareDrop = (e: React.DragEvent<HTMLDivElement>, toSquare: string) => {
    e.preventDefault();

    if (!dragState.fromSquare) return;

    // Check if this move would trigger a promotion
    if (isPromotionMove(dragState.fromSquare, toSquare)) {
      const piece = game.get(dragState.fromSquare as any);
      const pawnColor = piece?.color === 'w' ? 'white' : 'black';
      setPromotionPending({ fromSquare: dragState.fromSquare, toSquare, pawnColor });
      setDragState({ fromSquare: null, piece: null });
      setLegalMoves([]);
      return;
    }

    executeMove(dragState.fromSquare, toSquare);
  };

  const handleBoardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState.fromSquare) {
      setDragState(prev => ({
        ...prev,
        cursorX: e.clientX,
        cursorY: e.clientY
      }));
    }
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
      // Check if this move would trigger a promotion
      if (isPromotionMove(dragState.fromSquare, square)) {
        const piece = game.get(dragState.fromSquare as any);
        const pawnColor = piece?.color === 'w' ? 'white' : 'black';
        setPromotionPending({ fromSquare: dragState.fromSquare, toSquare: square, pawnColor });
        setDragState({ fromSquare: null, piece: null });
        setLegalMoves([]);
        return;
      }

      executeMove(dragState.fromSquare, square);
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
      pieceColor: piece.color,
      cursorX: touch.clientX,
      cursorY: touch.clientY,
      touchStartX: touch.clientX,
      touchStartY: touch.clientY
    });
    setLegalMoves(legalSquares);
  };

  const handleBoardTouchMove = (e: React.TouchEvent) => {
    if (!dragState.fromSquare) return;
    
    const touch = e.touches[0];
    setDragState(prev => ({
      ...prev,
      cursorX: touch.clientX,
      cursorY: touch.clientY
    }));
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
    const isBlackPerspective = playerColor === 'black';
    let rank: number;
    let file: number;
    
    if (isBlackPerspective) {
      // From black's perspective: index 0 is a8, index 1 is b8, etc.
      rank = Math.floor(squareIndex / 8);
      file = 7 - (squareIndex % 8);
    } else {
      // From white's perspective: index 0 is a1, index 1 is b1, etc.
      rank = 7 - Math.floor(squareIndex / 8);
      file = squareIndex % 8;
    }
    const toSquare = String.fromCharCode(97 + file) + (rank + 1);

    if (legalMoves.includes(toSquare)) {
      // Check if this move would trigger a promotion
      if (isPromotionMove(dragState.fromSquare, toSquare)) {
        const piece = game.get(dragState.fromSquare as any);
        const pawnColor = piece?.color === 'w' ? 'white' : 'black';
        setPromotionPending({ fromSquare: dragState.fromSquare, toSquare, pawnColor });
        setDragState({ fromSquare: null, piece: null });
        setLegalMoves([]);
        return;
      }

      executeMove(dragState.fromSquare, toSquare);
    }

    setDragState({ fromSquare: null, piece: null });
    setLegalMoves([]);
  };

  const getSquareColor = (file: number, rank: number): string => {
    return (file + rank) % 2 === 0 ? 'black' : 'white';
  };

  const resetGame = () => {
    // This function is no longer needed as reset happens at parent level
  };

  const renderBoard = () => {
    const squares = [];
    
    const isBlackPerspective = playerColor === 'black';
    const rankStart = isBlackPerspective ? 0 : 7;
    const rankEnd = isBlackPerspective ? 8 : -1;
    const rankStep = isBlackPerspective ? 1 : -1;
    const fileStart = isBlackPerspective ? 7 : 0;
    const fileEnd = isBlackPerspective ? -1 : 8;
    const fileStep = isBlackPerspective ? -1 : 1;

    for (let rank = rankStart; rank !== rankEnd; rank += rankStep) {
      for (let file = fileStart; file !== fileEnd; file += fileStep) {
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
                className={`piece ${piece.color === 'w' ? 'white' : 'black'} ${isFromSquare ? 'dragging' : ''}`}
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

  const renderDragGhost = () => {
    if (!dragState.fromSquare || !dragState.piece || dragState.cursorX === undefined || dragState.cursorY === undefined) {
      return null;
    }

    return (
      <div
        className="drag-ghost"
        style={{
          left: `${dragState.cursorX}px`,
          top: `${dragState.cursorY}px`,
        }}
      >
        <img
          src={getPieceImage(dragState.piece, dragState.pieceColor || 'w')}
          alt="dragging piece"
          className="drag-ghost-image"
        />
      </div>
    );
  };

  return (
    <div 
      className={`chessboard-container ${isDisabled ? 'disabled' : ''}`}
      style={chessboardSize ? { width: chessboardSize, height: chessboardSize } : undefined}
    >
      <div 
        ref={boardRef}
        className="board" 
        onTouchEnd={handleBoardTouchEnd}
        onTouchMove={handleBoardTouchMove}
        onMouseMove={handleBoardMouseMove}
      >
        {renderBoard()}
      </div>
      {renderDragGhost()}
      <PromotionDialog
        isOpen={promotionPending !== null}
        pawnColor={promotionPending?.pawnColor || 'white'}
        onSelect={handlePromotionSelect}
      />
    </div>
  );
};
