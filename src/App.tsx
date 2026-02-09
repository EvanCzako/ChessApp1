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

interface PendingMove {
  san: string;
  score: number;
  rank: number;
  totalMoves: number;
}

type Difficulty = 'impossible' | 'hard' | 'medium' | 'easy';
type PlayerColor = 'white' | 'black';

function App() {
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
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

  const isDisabled = currentMoveIndex !== moves.length - 1 || isComputerThinking || pendingMove !== null;

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

      // Evaluate all moves
      const evaluations = await evaluateMoves(
        gameAtPosition.fen(),
        legalMoves,
        10
      );

      // Create a map of move notation to score for quick lookup
      const evalMap = new Map(evaluations.map((evaluation) => [evaluation.move, evaluation]));

      // Always sort descending (highest/most positive first)
      const sortedMoves = evaluations.slice().sort((a, b) => b.score - a.score);

      console.log('Ranked moves (White perspective):', sortedMoves.map(m => ({ move: m.move, eval: m.score })));

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
      
      // Determine if computer is White or Black
      const isComputerWhite = playerColor === 'black';

      // Since evaluations are always from White's perspective:
      // - White picks from TOP (highest positive scores)
      // - Black picks from BOTTOM (lowest/most negative scores)
      let candidateMoves;
      if (isComputerWhite) {
        // Computer is White: pick from top
        candidateMoves = sortedMoves.slice(0, moveCount);
      } else {
        // Computer is Black: pick from bottom
        candidateMoves = sortedMoves.slice(-moveCount);
      }
      
      // Randomly select from candidate moves
      selectedMove = candidateMoves[Math.floor(Math.random() * candidateMoves.length)];

      // Find the rank of the selected move in the full sorted list
      const rankInSortedList = sortedMoves.findIndex(m => m.move === selectedMove.move) + 1;
      
      // For display: invert rank for Black (most negative = rank 1, most positive = rank 30)
      const displayRank = isComputerWhite ? rankInSortedList : sortedMoves.length - rankInSortedList + 1;

      // Show the pending move instead of making it immediately
      setPendingMove({
        san: selectedMove.move,
        score: selectedMove.score,
        rank: displayRank,
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

  const handlePlayerColorChange = (newColor: PlayerColor) => {
    setPlayerColor(newColor);
    // Reset game when player color changes
    setGame(new Chess());
    setMoves([]);
    setCurrentMoveIndex(-1);
    setIsComputerThinking(false);
    setPendingMove(null);
  };

  return (
    <div className="app">
      <div className="main-content" ref={mainContentRef}>
        <Chessboard 
          game={gameAtPosition} 
          isDisabled={isDisabled} 
          onMove={handleMove}
          chessboardSize={chessboardSize}
        />
        <GameInfo
          game={gameAtPosition}
          currentMoveIndex={currentMoveIndex}
          moves={moves}
          difficulty={difficulty}
          playerColor={playerColor}
          isComputerThinking={isComputerThinking}
          pendingMove={pendingMove}
          onNewGame={handleNewGame}
          onDifficultyChange={handleDifficultyChange}
          onPlayerColorChange={handlePlayerColorChange}
          onNavigate={handleNavigate}
          onResetFromHere={handleResetFromHere}
          onConfirmMove={confirmComputerMove}
        />
      </div>
    </div>
  )
}

export default App
