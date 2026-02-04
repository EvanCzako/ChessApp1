import { useState, useEffect } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from './components/Chessboard'
import { PGNNavigator } from './components/PGNNavigator'
import { MovesList } from './components/MovesList'
import './App.css'

interface MoveRecord {
  san: string;
  fen: string;
}

function App() {
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);

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

  const isDisabled = currentMoveIndex !== moves.length - 1;

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
  };

  return (
    <div className="app">
      <h1>Chess Game</h1>
      <div className="controls-top">
        <button onClick={handleNewGame} className="new-game-btn">
          New Game
        </button>
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
