import { useState, useEffect } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from './components/Chessboard'
import { PGNNavigator } from './components/PGNNavigator'
import { evaluateMoves } from './utils/stockfishEval'
import './App.css'

interface MoveRecord {
  san: string;
  fen: string;
}

interface PendingMove {
  san: string;
  score: number;
  rank: number;
  totalMoves: number;
}

type Difficulty = 'impossible' | 'hard' | 'medium' | 'easy';

function App() {
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('impossible');

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

  const isDisabled = currentMoveIndex !== moves.length - 1 || isComputerThinking || pendingMove !== null;

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
  }, [currentMoveIndex, moves.length]);

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
        10
      );

      // Create a map of move notation to score for quick lookup
      const evalMap = new Map(evaluations.map((evaluation) => [evaluation.move, evaluation]));

      // Sort by score - objective rating where positive is good for White, negative for Black
      const sortedMoves = evaluations
        .sort((a, b) => a.score - b.score); // Ascending order (lowest/worst for White first)

      console.log('Computer ranked moves:', sortedMoves.map(m => ({ move: m.move, eval: m.score })));

      // Select move based on difficulty
      let selectedMove;
      const percentages: Record<Difficulty, number> = {
        impossible: 0,    // Top 1 move (0%)
        hard: 0.1,        // Top 10%
        medium: 0.2,      // Top 20%
        easy: 0.5,        // Top 50%
      };

      const percentile = percentages[difficulty];
      const moveCount = Math.max(1, Math.ceil(sortedMoves.length * percentile));
      const candidateMoves = sortedMoves.slice(0, moveCount);
      
      // Randomly select from candidate moves
      selectedMove = candidateMoves[Math.floor(Math.random() * candidateMoves.length)];

      // Find the rank of the selected move in the full sorted list
      const selectedMoveRank = sortedMoves.findIndex(m => m.move === selectedMove.move) + 1;

      // Show the pending move instead of making it immediately
      // Convert to PendingMove format (using the move property as san)
      setPendingMove({
        san: selectedMove.move,
        score: selectedMove.score,
        rank: selectedMoveRank,
        totalMoves: sortedMoves.length
      });
    } catch (error) {
      console.error('Error in computer move:', error);
      setIsComputerThinking(false);
    }
  };

  const confirmComputerMove = () => {
    if (!pendingMove) return;

    // Make the move
    const newMoves = moves.slice(0, currentMoveIndex + 1);
    newMoves.push({
      san: pendingMove.san,
      fen: gameAtPosition.fen(),
    });
    setMoves(newMoves);
    setCurrentMoveIndex(newMoves.length - 1);
    setPendingMove(null);
    setIsComputerThinking(false);
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

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
  };

  return (
    <div className="app">
      <h1>Chess Game</h1>
      <div className="controls-top">
        <button onClick={handleNewGame} className="new-game-btn">
          New Game
        </button>
        <div className="difficulty-selector">
          <label htmlFor="difficulty">Difficulty:</label>
          <select 
            id="difficulty"
            className="difficulty-dropdown"
            value={difficulty}
            onChange={(e) => handleDifficultyChange(e.target.value as Difficulty)}
            disabled={isComputerThinking}
          >
            <option value="impossible">Impossible</option>
            <option value="hard">Hard</option>
            <option value="medium">Medium</option>
            <option value="easy">Easy</option>
          </select>
        </div>
        {isComputerThinking && !pendingMove && <span className="computer-thinking">Computer is thinking...</span>}
      </div>
      {pendingMove && (
        <div className="pending-move-prompt">
          <div className="pending-move-content">
            <h2>Computer's Move</h2>
            <p className="pending-move-text">
              Computer will play: <span className="move-highlight">{pendingMove.san}</span>
            </p>
            <p className="pending-move-score">
              Evaluation: <span className="score-value">{pendingMove.score.toFixed(1)}</span>
            </p>
            <p className="pending-move-rank">
              Played {pendingMove.rank === 1 ? '1st' : pendingMove.rank === 2 ? '2nd' : pendingMove.rank === 3 ? '3rd' : `${pendingMove.rank}th`} best move of {pendingMove.totalMoves} possibilities
            </p>
            <button onClick={confirmComputerMove} className="confirm-btn">
              Proceed
            </button>
          </div>
        </div>
      )}
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
      </div>
    </div>
  )
}

export default App
