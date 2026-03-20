import React from 'react';
import { Chess } from 'chess.js';
import { detectGameStatus } from '../utils/drawDetection';
import '../styles/PGNNavigator.css';

interface PGNNavigatorProps {
  currentMoveIndex: number;
  moves: Array<{ san: string; fen: string }>;
  onNavigate: (moveIndex: number) => void;
}

export const PGNNavigator: React.FC<PGNNavigatorProps> = ({
  currentMoveIndex,
  moves,
  onNavigate,
}) => {
  // Determine game result from final FEN
  const getGameResult = () => {
    if (moves.length === 0) return null;
    
    const finalMove = moves[moves.length - 1];
    
    // Check if this is a pseudo-move (like "(initial)" marker)
    if (finalMove.san.startsWith('(')) {
      // For pseudo-moves, just check the FEN position directly
      const game = new Chess(finalMove.fen);
      const gameStatus = detectGameStatus(game);
      if (gameStatus.isGameOver) {
        if (gameStatus.reason === 'checkmate') {
          return game.turn() === 'w' ? '0-1' : '1-0';
        } else if (gameStatus.reason === 'stalemate' || gameStatus.reason === 'repetition' || gameStatus.reason === 'move-rule-50' || gameStatus.reason === 'insufficient-material') {
          return '½-½';
        }
      }
      return null;
    }
    
    const game = new Chess(finalMove.fen);
    game.move(finalMove.san.split(' ')[0]); // Get the actual move without result notation
    
    const gameStatus = detectGameStatus(game);
    if (gameStatus.isGameOver) {
      if (gameStatus.reason === 'checkmate') {
        return game.turn() === 'w' ? '0-1' : '1-0'; // If it's white's turn, black just moved and checkmated
      } else if (gameStatus.reason === 'stalemate' || gameStatus.reason === 'repetition' || gameStatus.reason === 'move-rule-50' || gameStatus.reason === 'insufficient-material') {
        return '½-½';
      }
    }
    return null;
  };

  const renderMoveList = () => {
    const moveElements = [];
    const gameResult = getGameResult();
    
    // Skip pseudo-moves (like "(initial)") when counting move numbers
    let actualMoves = moves;
    let startIndex = 0;
    if (moves.length > 0 && moves[0].san.startsWith('(')) {
      actualMoves = moves.slice(1);
      startIndex = 1;
    }
    
    for (let i = 0; i < actualMoves.length; i += 2) {
      const whiteMove = actualMoves[i];
      const blackMove = actualMoves[i + 1];
      const moveNumber = Math.floor(i / 2) + 1;
      const whiteIndex = i + startIndex;
      const blackIndex = i + startIndex + 1;
      
      // Extract move notation (remove result notation like " ½-½")
      const whiteMoveText = whiteMove.san.split(' ')[0];
      const blackMoveText = blackMove ? blackMove.san.split(' ')[0] : '';

      moveElements.push(
        <div key={moveNumber} className="move-pair">
          <div className="move-number">{moveNumber}.</div>
          <div
            className={`move ${currentMoveIndex === whiteIndex ? 'current' : ''}`}
            onClick={() => onNavigate(whiteIndex)}
          >
            {whiteMoveText}
          </div>
          {blackMove && (
            <div
              className={`move ${currentMoveIndex === blackIndex ? 'current' : ''}`}
              onClick={() => onNavigate(blackIndex)}
            >
              {blackMoveText}
            </div>
          )}
          {/* Show game result after the final move pair */}
          {gameResult && ((i === actualMoves.length - 2 && blackMove) || (i === actualMoves.length - 1 && !blackMove)) && (
            <div className="game-result">{gameResult}</div>
          )}
        </div>
      );
    }
    return moveElements;
  };

  return (
    <div className="pgn-navigator">
      <div className="moves-list">{renderMoveList()}</div>
    </div>
  );
};
