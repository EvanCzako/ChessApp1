import { useState, useEffect, useRef } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from './components/Chessboard'
import { GameInfo } from './components/GameInfo'
import { evaluateMoves } from './utils/stockfishEval'
import './App.css'

interface MoveRecord {
  san: string;
  fen: string;
}

type Difficulty = 'impossible' | 'hard' | 'medium' | 'easy';
type PlayerColor = 'white' | 'black';

function App() {
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('impossible');
  const [playerColor, setPlayerColor] = useState<PlayerColor>('white');
  const [chessboardSize, setChessboardSize] = useState<number | undefined>();
  const mainContentRef = useRef<HTMLDivElement>(null);

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
    // 2. It's the computer's turn
    // 3. We're not already thinking
    const computerColor = playerColor === 'white' ? 'b' : 'w';
    
    if (
      currentMoveIndex === moves.length - 1 &&
      gameAtPosition.turn() === computerColor &&
      !isComputerThinking
    ) {
      makeComputerMove();
    }
  }, [currentMoveIndex, moves.length, playerColor]);

  // Measure main-content and calculate chessboard size
  useEffect(() => {
    if (!mainContentRef.current) return;

    const observer = new ResizeObserver(() => {
      const rect = mainContentRef.current?.getBoundingClientRect();
      if (rect) {
        // Chessboard is always square
        const isLandscape = window.innerWidth > window.innerHeight;
        let size: number;
        
        if (isLandscape) {
          // In landscape, constrain by height and width minus GameInfo's minimum (200px)
          const maxWidthForBoard = Math.max(0, rect.width - 200);
          size = Math.min(rect.height, maxWidthForBoard);
        } else {
          // In portrait, size by width
          // Desktop scrollbars take up space, mobile scrollbars don't
          const hasHoverCapability = window.matchMedia('(hover: hover)').matches;
          const scrollbarWidth = hasHoverCapability ? 15 : 0;
          size = Math.max(0, rect.width - scrollbarWidth);
        }
        
        setChessboardSize(Math.max(0, size));
      }
    });

    observer.observe(mainContentRef.current);
    
    return () => observer.disconnect();
  }, []);

  const makeComputerMove = async () => {
    setIsComputerThinking(true);
    try {
      const legalMoves = gameAtPosition.moves({ verbose: false });
      
      if (legalMoves.length === 0) {
        setIsComputerThinking(false);
        return; // Game is over
      }

      // Calculate how many top moves to evaluate based on difficulty
      const percentages: Record<Difficulty, number> = {
        impossible: 0,    // Top 1 move (0%)
        hard: 0.1,        // Top 10%
        medium: 0.2,      // Top 20%
        easy: 0.5,        // Top 50%
      };

      const percentile = percentages[difficulty];
      const maxMoveCount = Math.max(1, Math.ceil(legalMoves.length * percentile));
      
      // Randomly pick which ranked move to select (e.g., pick the 7th best from top 10)
      const selectedRank = Math.floor(Math.random() * maxMoveCount) + 1;

      // Evaluate only up to the randomly selected rank
      const evaluations = await evaluateMoves(
        gameAtPosition.fen(),
        legalMoves,
        10,
        selectedRank
      );

      console.log(`Ranked moves (perspective of side to move): selecting rank ${selectedRank}`, evaluations.map(m => ({ move: m.move, eval: m.score })));

      // Select the last move (which is the randomly selected rank)
      const selectedMove = evaluations[evaluations.length - 1];

      // Make the move immediately
      const newMoves = moves.slice(0, currentMoveIndex + 1);
      newMoves.push({
        san: selectedMove.move,
        fen: gameAtPosition.fen(),
      });
      setMoves(newMoves);
      setCurrentMoveIndex(newMoves.length - 1);
      setIsComputerThinking(false);
    } catch (error) {
      console.error('Error in computer move:', error);
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

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
  };

  const handlePlayerColorChange = (newColor: PlayerColor) => {
    setPlayerColor(newColor);
    // Reset game when player color changes
    setGame(new Chess());
    setMoves([]);
    setCurrentMoveIndex(-1);
    setIsComputerThinking(false);
  };

  return (
    <div className="app">
      <div className="main-content" ref={mainContentRef}>
        <Chessboard 
          game={gameAtPosition} 
          isDisabled={isDisabled} 
          onMove={handleMove}
          chessboardSize={chessboardSize}
          playerColor={playerColor}
        />
        <GameInfo
          currentMoveIndex={currentMoveIndex}
          moves={moves}
          difficulty={difficulty}
          playerColor={playerColor}
          isComputerThinking={isComputerThinking}
          onNewGame={handleNewGame}
          onDifficultyChange={handleDifficultyChange}
          onPlayerColorChange={handlePlayerColorChange}
          onNavigate={handleNavigate}
          onResetFromHere={handleResetFromHere}
        />
      </div>
    </div>
  )
}

export default App
