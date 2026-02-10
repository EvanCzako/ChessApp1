import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function evaluateMoves(
  fen: string,
  movesSan: string[],
  depth: number = 15
): Promise<Array<{ move: string; score: number; isMate: boolean }>> {
  try {
    // Request evaluation for all moves
    const response = await axios.post(`${API_URL}/api/evaluate`, {
      fen,
      depth,
      moves: movesSan
    });

    const { topMoves } = response.data;

    // Convert to our format
    const evaluations: Array<{ move: string; score: number; isMate: boolean }> = [];
    
    if (topMoves && Array.isArray(topMoves)) {
      for (const move of topMoves) {
        evaluations.push({
          move: move.move,
          score: move.evaluation,
          isMate: false,
        });
      }
    }

    // Log Stockfish evaluation rankings sorted by score
    const rankedEvals = evaluations.sort((a, b) => b.score - a.score);
    console.log('Stockfish Evaluation Rankings:', rankedEvals.map((e, index) => ({
      rank: index + 1,
      move: e.move,
      score: e.score
    })));

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
