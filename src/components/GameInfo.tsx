import React from 'react';
import { PGNNavigator } from './PGNNavigator';
import '../styles/GameInfo.css';

type Difficulty = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type PlayerColor = 'white' | 'black';

interface GameInfoProps {
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
            <option value="1">1 - Easiest</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9 - Hardest</option>
          </select>
        </div>
        {isComputerThinking && (
          <span className="computer-thinking">Computer is thinking...</span>
        )}
      </div>

      {moves.length > 0 && (
        <PGNNavigator
          currentMoveIndex={currentMoveIndex}
          moves={moves}
          onNavigate={onNavigate}
          onResetFromHere={onResetFromHere}
        />
      )}
    </div>
  );
};
