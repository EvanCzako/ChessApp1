import React from 'react';
import { Chess } from 'chess.js';
import { PGNNavigator } from './PGNNavigator';
import '../styles/GameInfo.css';

type Difficulty = 'impossible' | 'hard' | 'medium' | 'easy';
type PlayerColor = 'white' | 'black';

interface GameInfoProps {
  game: Chess;
  currentMoveIndex: number;
  moves: Array<{ san: string; fen: string }>;
  difficulty: Difficulty;
  playerColor: PlayerColor;
  isComputerThinking: boolean;
  onNewGame: () => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onPlayerColorChange: (color: PlayerColor) => void;
  onNavigate: (moveIndex: number) => void;
  onResetFromHere: (moveIndex: number) => void;
}

export const GameInfo: React.FC<GameInfoProps> = ({
  game,
  currentMoveIndex,
  moves,
  difficulty,
  playerColor,
  isComputerThinking,
  onNewGame,
  onDifficultyChange,
  onPlayerColorChange,
  onNavigate,
  onResetFromHere,
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
        {isComputerThinking && (
          <span className="computer-thinking">Computer is thinking...</span>
        )}
      </div>

      {moves.length > 0 && (
        <PGNNavigator
          game={game}
          currentMoveIndex={currentMoveIndex}
          moves={moves}
          onNavigate={onNavigate}
          onResetFromHere={onResetFromHere}
        />
      )}
    </div>
  );
};
