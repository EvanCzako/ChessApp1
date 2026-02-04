import axios from 'axios';

const API_URL = 'http://localhost:3001';

export async function evaluateMoves(
  fen: string,
  movesSan: string[],
  depth: number = 15
): Promise<Array<{ move: string; score: number; isMate: boolean }>> {
  try {
    const { Chess } = await import('chess.js');

    // Build all positions to evaluate
    const movesWithFen: Array<{ san: string; fen: string }> = [];
    for (const move of movesSan) {
      try {
        const testGame = new Chess(fen);
        testGame.move(move);
        movesWithFen.push({
          san: move,
          fen: testGame.fen(),
        });
      } catch (error) {
        console.error(`Error building position for ${move}:`, error);
      }
    }

    console.log(`Evaluating ${movesWithFen.length} positions with Stockfish (depth: ${depth})...`);

    // Evaluate the current position to get top moves
    const response = await axios.post(`${API_URL}/api/evaluate`, {
      fen,
      depth
    });

    const { topMoves } = response.data;

    // Map the top moves back to our format, filtering to only moves that are in our legal moves
    const evaluations: Array<{ move: string; score: number; isMate: boolean }> = [];
    
    if (topMoves && Array.isArray(topMoves)) {
      for (const topMove of topMoves) {
        // Find the matching legal move
        const matchingMove = movesWithFen.find(m => m.san === topMove.move);
        if (matchingMove) {
          evaluations.push({
            move: matchingMove.san,
            score: topMove.evaluation,
            isMate: false,
          });
        }
      }
    }

    // Add any remaining legal moves that weren't in top 5 (with lower scores)
    for (const moveWithFen of movesWithFen) {
      if (!evaluations.find(e => e.move === moveWithFen.san)) {
        evaluations.push({
          move: moveWithFen.san,
          score: 0,
          isMate: false,
        });
      }
    }

    console.log('Evaluations from Stockfish:', evaluations);
    return evaluations;
  } catch (error) {
    console.error('Error evaluating moves:', error);
    // Return moves with 0 score if evaluation fails
    return movesSan.map((move) => ({
      move,
      score: 0,
      isMate: false,
    }));
  }
}
