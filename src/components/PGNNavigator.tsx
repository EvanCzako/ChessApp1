import React from 'react';
import { Chess } from 'chess.js';
import '../styles/PGNNavigator.css';

interface PGNNavigatorProps {
  currentMoveIndex: number;
  moves: Array<{ san: string; fen: string }>;
  onNavigate: (moveIndex: number) => void;
  onResetFromHere: (moveIndex: number) => void;
}

export const PGNNavigator: React.FC<PGNNavigatorProps> = ({
  currentMoveIndex,
  moves,
  onNavigate,
  onResetFromHere,
}) => {
  const isAtEnd = currentMoveIndex === moves.length - 1;

  const handleResetClick = () => {
    onResetFromHere(currentMoveIndex);
  };

  const handleNavigateToStart = () => {
    onNavigate(-1);
  };

  const handleNavigatePrevious = () => {
    if (currentMoveIndex > -1) {
      onNavigate(currentMoveIndex - 1);
    }
  };

  const handleNavigateNext = () => {
    if (currentMoveIndex < moves.length - 1) {
      onNavigate(currentMoveIndex + 1);
    }
  };

  const handleNavigateToEnd = () => {
    onNavigate(moves.length - 1);
  };

  const renderMoveList = () => {
    const moveElements = [];
    for (let i = 0; i < moves.length; i += 2) {
      const whiteMove = moves[i];
      const blackMove = moves[i + 1];
      const moveNumber = Math.floor(i / 2) + 1;

      moveElements.push(
        <div key={moveNumber} className="move-pair">
          <div className="move-number">{moveNumber}.</div>
          <div
            className={`move ${currentMoveIndex === i ? 'current' : ''}`}
            onClick={() => onNavigate(i)}
          >
            {whiteMove.san}
          </div>
          {blackMove && (
            <div
              className={`move ${currentMoveIndex === i + 1 ? 'current' : ''}`}
              onClick={() => onNavigate(i + 1)}
            >
              {blackMove.san}
            </div>
          )}
        </div>
      );
    }
    return moveElements;
  };

  return (
    <div className="pgn-navigator">
      <div className="navigator-controls">
        <button
          onClick={handleNavigateToStart}
          disabled={currentMoveIndex === -1}
          title="Go to start"
        >
          {'⏮'}
        </button>
        <button
          onClick={handleNavigatePrevious}
          disabled={currentMoveIndex === -1}
          title="Previous move"
        >
          {'◀'}
        </button>
        <button
          onClick={handleNavigateNext}
          disabled={currentMoveIndex === moves.length - 1}
          title="Next move"
        >
          {'▶'}
        </button>
        <button
          onClick={handleNavigateToEnd}
          disabled={currentMoveIndex === moves.length - 1}
          title="Go to end"
        >
          {'⏭'}
        </button>
      </div>

      <div className="moves-list">{renderMoveList()}</div>

      {!isAtEnd && (
        <div className="reset-section">
          <button onClick={handleResetClick} className="reset-from-here-btn">
            Reset Game from Here
          </button>
          <p className="reset-info">Board is viewing a previous position. Click to start a new game from this position.</p>
        </div>
      )}
    </div>
  );
};
