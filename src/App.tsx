import { useState, useEffect, useRef } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from './components/Chessboard'
import { GameInfo } from './components/GameInfo'
import { evaluateMoves } from './utils/stockfishEval'
import { detectGameStatus } from './utils/drawDetection'
import './App.css'

interface MoveRecord {
  san: string;
  fen: string;
}

type Difficulty = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type PlayerColor = 'white' | 'black';

function App() {
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [isGameTerminal, setIsGameTerminal] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('9');
  const [playerColor, setPlayerColor] = useState<PlayerColor>('white');
  const [chessboardSize, setChessboardSize] = useState<number | undefined>();
  const [gameResetSignal, setGameResetSignal] = useState(0);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Reconstruct game at current position
  const gameAtPosition = (() => {
    // If no moves have been made, use the game state directly (for FEN loading)
    if (currentMoveIndex === -1 && moves.length === 0) {
      return game;
    }
    
    let g = new Chess();
    
    // Check if first move is a pseudo-move (initial position marker)
    if (moves.length > 0 && moves[0].san.startsWith('(')) {
      g = new Chess(moves[0].fen);
      // Replay moves starting from index 1
      for (let i = 1; i <= currentMoveIndex; i++) {
        if (i < moves.length) {
          try {
            // Strip result notation (e.g., " ½-½", "#") before applying move
            g.move(moves[i].san.split(' ')[0].replace('#', ''));
          } catch {
            break;
          }
        }
      }
    } else {
      // Standard replay from starting position
      for (let i = 0; i <= currentMoveIndex; i++) {
        if (i < moves.length) {
          try {
            // Strip result notation (e.g., " ½-½", "#") before applying move
            g.move(moves[i].san.split(' ')[0].replace('#', ''));
          } catch {
            break;
          }
        }
      }
    }
    
    return g;
  })();

  const isDisabled = currentMoveIndex !== moves.length - 1 || isComputerThinking || isGameTerminal;

  // Computer move after player moves
  useEffect(() => {
    // Only make computer move if:
    // 1. We're at the latest move
    // 2. Not in a pseudo-move state (loaded FEN position)
    // 3. It's the computer's turn
    // 4. We're not already thinking
    // 5. Game is not over
    const computerColor = playerColor === 'white' ? 'b' : 'w';
    const isPseudoMoveState = moves.length > 0 && moves[0].san.startsWith('(') && currentMoveIndex === 0;
    
    if (
      currentMoveIndex === moves.length - 1 &&
      !isPseudoMoveState &&
      gameAtPosition.turn() === computerColor &&
      !isComputerThinking &&
      !isGameTerminal
    ) {
      makeComputerMove();
    }
  }, [currentMoveIndex, moves.length, playerColor, isGameTerminal]);

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
      // Check if game is already over
      const gameStatus = detectGameStatus(gameAtPosition);
      if (gameStatus.isGameOver) {
        setIsComputerThinking(false);
        return;
      }

      const legalMoves = gameAtPosition.moves({ verbose: false });
      
      if (legalMoves.length === 0) {
        setIsComputerThinking(false);
        return; // Game is over
      }

      // Calculate how many top moves to evaluate based on difficulty
      const percentages: Record<Difficulty, number> = {
        '1': 0.5,   // Easiest - top 50%
        '2': 0.43,
        '3': 0.37,
        '4': 0.3,
        '5': 0.23,
        '6': 0.17,
        '7': 0.1,
        '8': 0.05,
        '9': 0,     // Hardest - top 1 move
      };

      const percentile = percentages[difficulty];
      const maxMoveCount = Math.max(1, Math.ceil(legalMoves.length * percentile));
      
      // Randomly pick which ranked move to select (e.g., pick the 7th best from top 10)
      const selectedRank = Math.floor(Math.random() * maxMoveCount) + 1;

      // Evaluate only up to the randomly selected rank
      const evaluations = await evaluateMoves(
        gameAtPosition.fen(),
        legalMoves,
        15,
        selectedRank
      );

      console.log(`Ranked moves (perspective of side to move): selecting rank ${selectedRank}`, evaluations.map(m => ({ move: m.move, eval: m.score })));

      // Select the last move (which is the randomly selected rank)
      const selectedMove = evaluations[evaluations.length - 1];

      // Create a copy of the game to check the result after this move
      const gameCopy = new Chess(gameAtPosition.fen());
      gameCopy.move(selectedMove.move);
      const moveGameStatus = detectGameStatus(gameCopy);

      // Enhance move notation with game-ending symbols
      let moveNotation = selectedMove.move;
      if (moveGameStatus.isGameOver) {
        if (moveGameStatus.reason === 'checkmate') {
          if (!moveNotation.includes('#')) {
            moveNotation += '#';
          }
        } else if (moveGameStatus.reason === 'stalemate') {
          moveNotation += ' ½-½';
        } else if (moveGameStatus.reason === 'repetition' || moveGameStatus.reason === 'move-rule-50' || moveGameStatus.reason === 'insufficient-material') {
          moveNotation += ' ½-½';
        }
      }

      // Make the move immediately
      const newMoves = moves.slice(0, currentMoveIndex + 1);
      newMoves.push({
        san: moveNotation,
        fen: gameAtPosition.fen(),
      });
      setMoves(newMoves);
      setCurrentMoveIndex(newMoves.length - 1);
      setIsGameTerminal(moveGameStatus.isGameOver);
      setIsComputerThinking(false);
    } catch (error) {
      console.error('Error in computer move:', error);
      setIsComputerThinking(false);
    }
  };

  const handleMove = (moveNotation: string) => {
    const newMoves = moves.slice(0, currentMoveIndex + 1);
    
    // Reconstruct the position BEFORE this move to save the correct FEN
    let preMoveGame = new Chess();
    
    if (moves.length > 0 && moves[0].san.startsWith('(')) {
      // Special case: position was loaded from FEN
      preMoveGame = new Chess(moves[0].fen);
      for (let i = 1; i <= currentMoveIndex; i++) {
        if (i < moves.length) {
          try {
            preMoveGame.move(moves[i].san.split(' ')[0]);
          } catch {
            break;
          }
        }
      }
    } else {
      // Standard replay from starting position
      for (let i = 0; i <= currentMoveIndex; i++) {
        if (i < moves.length) {
          try {
            preMoveGame.move(moves[i].san.split(' ')[0]);
          } catch {
            break;
          }
        }
      }
    }
    
    const newMove: MoveRecord = {
      san: moveNotation,
      fen: preMoveGame.fen(),
    };
    newMoves.push(newMove);
    
    // Check if this move ends the game
    const postMoveGame = new Chess(preMoveGame.fen());
    postMoveGame.move(moveNotation.split(' ')[0]); // Remove result notation if present
    const gameStatus = detectGameStatus(postMoveGame);
    
    setMoves(newMoves);
    setCurrentMoveIndex(newMoves.length - 1);
    setIsGameTerminal(gameStatus.isGameOver);
  };

  const handleNavigate = (moveIndex: number) => {
    setCurrentMoveIndex(moveIndex);
  };

  const handleResetFromHere = (moveIndex: number) => {
    const newMoves = moves.slice(0, moveIndex + 1);
    setMoves(newMoves);
    setCurrentMoveIndex(moveIndex);
    
    // Check if the position we're resetting to is terminal
    if (newMoves.length > 0) {
      const lastMove = newMoves[newMoves.length - 1];
      const checkGame = new Chess(lastMove.fen);
      checkGame.move(lastMove.san.split(' ')[0]);
      const status = detectGameStatus(checkGame);
      setIsGameTerminal(status.isGameOver);
    } else {
      setIsGameTerminal(false);
    }
  };

  const handleNewGame = () => {
    setGame(new Chess());
    setMoves([]);
    setCurrentMoveIndex(-1);
    setIsComputerThinking(false);
    setIsGameTerminal(false);
    setGameResetSignal((prev) => prev + 1);
  };

  const handleLoadPawnPromotion = () => {
    // Load a position where white pawn is on a7, ready to promote
    const promotionFen = '8/P7/8/8/8/8/5k2/7K w - - 0 1';
    const g = new Chess(promotionFen);
    setGame(g);
    // Add initial position to moves so subsequent moves can be properly tracked
    setMoves([{
      san: '(initial)',
      fen: promotionFen,
    }]);
    setCurrentMoveIndex(0);
    setIsComputerThinking(false);
    setIsGameTerminal(false);
    setGameResetSignal((prev) => prev + 1);
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
    setIsGameTerminal(false);
    setGameResetSignal((prev) => prev + 1);
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
          gameResetSignal={gameResetSignal}
        />
        <GameInfo
          game={gameAtPosition}
          currentMoveIndex={currentMoveIndex}
          moves={moves}
          difficulty={difficulty}
          playerColor={playerColor}
          isComputerThinking={isComputerThinking}
          onNewGame={handleNewGame}
          onLoadPawnPromotion={handleLoadPawnPromotion}
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
