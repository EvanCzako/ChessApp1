import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { evaluateMoves as evaluateMovesEngine } from '../utils/stockfishEval';
import '../styles/MovesList.css';

interface MovesListProps {
  game: Chess;
  onMoveClick: (moveNotation: string) => void;
  isDisabled: boolean;
}

interface MoveEval {
  san: string;
  from: string;
  to: string;
  score: number | null;
  loading: boolean;
  isMate: boolean;
}

export const MovesList: React.FC<MovesListProps> = ({ game, onMoveClick, isDisabled }) => {
  const [moves, setMoves] = useState<MoveEval[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    const legalMoves = game.moves({ verbose: true });
    
    // Don't initialize moves yet - wait for evaluations
    setMoves([]);
    setIsEvaluating(true);

    // Evaluate moves
    evaluateMoves(legalMoves);
  }, [game.fen()]);

  const evaluateMoves = async (legalMoves: any[]) => {
    try {
      const evaluations = await evaluateMovesEngine(
        game.fen(),
        legalMoves.map((m) => m.san),
        10
      );

      console.log('Evaluations received:', evaluations);
      console.log('Legal moves count:', legalMoves.length);

      // Create a map of move notation to evaluation for quick lookup
      const evalMap = new Map(evaluations.map((evaluation) => [evaluation.move, evaluation]));
      console.log('EvalMap size:', evalMap.size);

      const updatedMoves: MoveEval[] = legalMoves.map((move) => {
        const moveEval = evalMap.get(move.san);
        return {
          san: move.san,
          from: move.from,
          to: move.to,
          score: moveEval?.score ?? 0,
          loading: false,
          isMate: moveEval?.isMate ?? false,
        };
      });

      console.log('Updated moves before sort:', updatedMoves);

      // Sort by score - objective rating where positive is good for White, negative for Black
      updatedMoves.sort((a, b) => b.score - a.score);

      console.log('Ranked moves:', updatedMoves.map(m => ({ move: m.san, eval: m.score })));
      setMoves(updatedMoves);
    } catch (error) {
      console.error('Error evaluating moves:', error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleMoveClick = (moveNotation: string) => {
    if (!isDisabled) {
      onMoveClick(moveNotation);
    }
  };

  const formatScore = (score: number): string => {
    if (score === 0) return '0.0';
    if (score > 100) return `+M${Math.ceil(score / 10)}`;
    if (score < -100) return `-M${Math.ceil(Math.abs(score) / 10)}`;
    return score.toFixed(1);
  };

  return (
    <div className={`moves-list-container ${isDisabled ? 'disabled' : ''}`}>
      <h3 className="moves-list-title">
        Available Moves ({moves.length})
        {isEvaluating && <span className="evaluating-badge">Evaluating...</span>}
      </h3>
      {isEvaluating ? (
        <div className="moves-evaluated">
          <div className="evaluating-message">Evaluating moves...</div>
        </div>
      ) : (
        <div className="moves-evaluated">
          {moves.map((move, idx) => (
            <button
              key={idx}
              className={`move-eval-button ${move.isMate ? 'mate' : ''}`}
              onClick={() => handleMoveClick(move.san)}
              disabled={isDisabled}
              title={`${move.from} → ${move.to}`}
            >
              <span className="move-notation">{move.san}</span>
              <span className="move-score">{formatScore(move.score)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
