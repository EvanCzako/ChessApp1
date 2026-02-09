import React from 'react';
import { Chess } from 'chess.js';
import { PGNNavigator } from './PGNNavigator';
import '../styles/GameInfo.css';

interface PendingMove {
  san: string;
  score: number;
  rank: number;
  totalMoves: number;
}

type Difficulty = 'impossible' | 'hard' | 'medium' | 'easy';
type PlayerColor = 'white' | 'black';

interface GameInfoProps {
  game: Chess;
  currentMoveIndex: number;
  moves: Array<{ san: string; fen: string }>;
  difficulty: Difficulty;
  playerColor: PlayerColor;
  isComputerThinking: boolean;
  pendingMove: PendingMove | null;
  onNewGame: () => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onPlayerColorChange: (color: PlayerColor) => void;
  onNavigate: (moveIndex: number) => void;
  onResetFromHere: (moveIndex: number) => void;
  onConfirmMove: () => void;
}

export const GameInfo: React.FC<GameInfoProps> = ({
  game,
  currentMoveIndex,
  moves,
  difficulty,
  playerColor,
  isComputerThinking,
  pendingMove,
  onNewGame,
  onDifficultyChange,
  onPlayerColorChange,
  onNavigate,
  onResetFromHere,
  onConfirmMove,
}) => {
  return (
    <div className="game-info">
      <div className="controls-top">
        <button onClick={onNewGame} className="new-game-btn">
          New Game
        </button>
        <div className="color-selector">
          <label htmlFor="color">Play as:</label>
          <select
            id="color"
            className="color-dropdown"
            value={playerColor}
            onChange={(e) => onPlayerColorChange(e.target.value as PlayerColor)}
            disabled={isComputerThinking}
          >
            <option value="white">White</option>
            <option value="black">Black</option>
          </select>
        </div>
        <div className="difficulty-selector">
          <label htmlFor="difficulty">Difficulty:</label>
          <select
            id="difficulty"
            className="difficulty-dropdown"
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value as Difficulty)}
            disabled={isComputerThinking}
          >
            <option value="impossible">Impossible</option>
            <option value="hard">Hard</option>
            <option value="medium">Medium</option>
            <option value="easy">Easy</option>
          </select>
        </div>
        {isComputerThinking && !pendingMove && (
          <span className="computer-thinking">Computer is thinking...</span>
        )}
      </div>

      {pendingMove && (
        <div className="pending-move-prompt-inline">
          <div className="pending-move-content">
            <h2>Computer's Move</h2>
            <p className="pending-move-text">
              Computer will play: <span className="move-highlight">{pendingMove.san}</span>
            </p>
            <p className="pending-move-score">
              Evaluation: <span className="score-value">{pendingMove.score.toFixed(1)}</span>
            </p>
            <p className="pending-move-rank">
              Played{' '}
              {pendingMove.rank === 1
                ? '1st'
                : pendingMove.rank === 2
                  ? '2nd'
                  : pendingMove.rank === 3
                    ? '3rd'
                    : `${pendingMove.rank}th`}{' '}
              best move of {pendingMove.totalMoves} possibilities
            </p>
            <button onClick={onConfirmMove} className="confirm-btn">
              Proceed
            </button>
          </div>
        </div>
      )}

      {moves.length > 0 && (
        <PGNNavigator
          game={game}
          currentMoveIndex={currentMoveIndex}
          moves={moves}
          onNavigate={onNavigate}
          onResetFromHere={onResetFromHere}
        />
      )}

      <div className="fen-info">
        <p>Turn: <strong>{game.turn() === 'w' ? 'White' : 'Black'}</strong></p>
        <p>FEN: <code>{game.fen()}</code></p>
      </div>
    </div>
  );
};
