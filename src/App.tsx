import { useState, useEffect } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from './components/Chessboard'
import { PGNNavigator } from './components/PGNNavigator'
import { MovesList } from './components/MovesList'
import { evaluateMoves } from './utils/stockfishEval'
import './App.css'

interface MoveRecord {
  san: string;
  fen: string;
}

type Difficulty = 'easy' | 'medium' | 'hard' | 'impossible';

function App() {
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  // Reconstruct game at current position
  const gameAtPosition = (() => {
    const g = new Chess();
    for (let i = 0; i <= currentMoveIndex; i++) {
      if (i < moves.length) {
        g.move(moves[i].san);
      }
    }
    return g;
  })();

  const isDisabled = currentMoveIndex !== moves.length - 1 || isComputerThinking;

  // Computer move after player moves
  useEffect(() => {
    // Only make computer move if:
    // 1. We're at the latest move
    // 2. It's black's turn (computer's turn)
    // 3. We're not already thinking
    if (
      currentMoveIndex === moves.length - 1 &&
      gameAtPosition.turn() === 'b' &&
      !isComputerThinking &&
      moves.length > 0
    ) {
      makeComputerMove();
    }
  }, [currentMoveIndex, moves.length, difficulty]);

  const makeComputerMove = async () => {
    setIsComputerThinking(true);
    try {
      const legalMoves = gameAtPosition.moves({ verbose: false });
      
      if (legalMoves.length === 0) {
        setIsComputerThinking(false);
        return; // Game is over
      }

      // Evaluate all moves
      const evaluations = await evaluateMoves(
        gameAtPosition.fen(),
        legalMoves,
        4
      );

      // Sort by score (best first)
      const sortedMoves = legalMoves
        .map((san, idx) => ({
          san,
          score: evaluations[idx]?.score ?? 0,
        }))
        .sort((a, b) => b.score - a.score);

      // Select from top N% based on difficulty
      let percentile: number;
      switch (difficulty) {
        case 'impossible':
          percentile = 1; // Always best move
          break;
        case 'hard':
          percentile = 10;
          break;
        case 'medium':
          percentile = 20;
          break;
        case 'easy':
          percentile = 50;
          break;
        default:
          percentile = 20;
      }

      const topCount = Math.max(1, Math.ceil((sortedMoves.length * percentile) / 100));
      const topMoves = sortedMoves.slice(0, topCount);
      const selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)];

      // Make the move
      const newMoves = moves.slice(0, currentMoveIndex + 1);
      newMoves.push({
        san: selectedMove.san,
        fen: gameAtPosition.fen(),
      });
      setMoves(newMoves);
      setCurrentMoveIndex(newMoves.length - 1);
    } catch (error) {
      console.error('Error in computer move:', error);
    } finally {
      setIsComputerThinking(false);
    }
  };

  const handleMove = (moveNotation: string) => {
    const newMoves = moves.slice(0, currentMoveIndex + 1);
    const newMove: MoveRecord = {
      san: moveNotation,
      fen: gameAtPosition.fen(),
    };
    newMoves.push(newMove);
    setMoves(newMoves);
    setCurrentMoveIndex(newMoves.length - 1);
  };

  const handleNavigate = (moveIndex: number) => {
    setCurrentMoveIndex(moveIndex);
  };

  const handleResetFromHere = (moveIndex: number) => {
    const newMoves = moves.slice(0, moveIndex + 1);
    setMoves(newMoves);
    setCurrentMoveIndex(moveIndex);
  };

  const handleNewGame = () => {
    setGame(new Chess());
    setMoves([]);
    setCurrentMoveIndex(-1);
    setIsComputerThinking(false);
  };

  return (
    <div className="app">
      <h1>Chess Game</h1>
      <div className="controls-top">
        <button onClick={handleNewGame} className="new-game-btn">
          New Game
        </button>
        <div className="difficulty-selector">
          <label htmlFor="difficulty-select">Difficulty:</label>
          <select
            id="difficulty-select"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="difficulty-dropdown"
          >
            <option value="easy">Easy (50%)</option>
            <option value="medium">Medium (20%)</option>
            <option value="hard">Hard (10%)</option>
            <option value="impossible">Impossible (1%)</option>
          </select>
        </div>
        {isComputerThinking && <span className="computer-thinking">Computer is thinking...</span>}
      </div>
      {moves.length > 0 && (
        <PGNNavigator
          game={gameAtPosition}
          currentMoveIndex={currentMoveIndex}
          moves={moves}
          onNavigate={handleNavigate}
          onResetFromHere={handleResetFromHere}
        />
      )}
      <div className="main-content">
        <Chessboard game={gameAtPosition} isDisabled={isDisabled} onMove={handleMove} />
        <MovesList game={gameAtPosition} onMoveClick={handleMove} isDisabled={isDisabled} />
      </div>
    </div>
  )
}

export default App
