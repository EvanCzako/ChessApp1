import React from 'react';
import { Chess } from 'chess.js';
import '../styles/MovesList.css';

interface MovesListProps {
  game: Chess;
  onMoveClick: (moveNotation: string) => void;
  isDisabled: boolean;
}

export const MovesList: React.FC<MovesListProps> = ({ game, onMoveClick, isDisabled }) => {
  const legalMoves = game.moves({ verbose: true });

  // Group moves by piece type
  const movesByPiece: { [key: string]: typeof legalMoves } = {};
  legalMoves.forEach((move) => {
    const piece = game.get(move.from as any)?.type || 'p';
    if (!movesByPiece[piece]) {
      movesByPiece[piece] = [];
    }
    movesByPiece[piece].push(move);
  });

  const pieceNames: { [key: string]: string } = {
    'p': 'Pawns',
    'n': 'Knights',
    'b': 'Bishops',
    'r': 'Rooks',
    'q': 'Queens',
    'k': 'King',
  };

  const pieceOrder = ['p', 'n', 'b', 'r', 'q', 'k'];

  const handleMoveClick = (moveNotation: string) => {
    if (!isDisabled) {
      onMoveClick(moveNotation);
    }
  };

  return (
    <div className={`moves-list-container ${isDisabled ? 'disabled' : ''}`}>
      <h3 className="moves-list-title">Available Moves ({legalMoves.length})</h3>
      <div className="moves-by-piece">
        {pieceOrder.map((piece) => {
          const moves = movesByPiece[piece];
          if (!moves || moves.length === 0) return null;

          return (
            <div key={piece} className="piece-group">
              <h4 className="piece-group-title">{pieceNames[piece]}</h4>
              <div className="piece-moves">
                {moves.map((move, idx) => (
                  <button
                    key={idx}
                    className="move-button"
                    onClick={() => handleMoveClick(move.san)}
                    disabled={isDisabled}
                    title={`${move.from} → ${move.to}`}
                  >
                    {move.san}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
