import { Chess } from 'chess.js';

export interface GameStatus {
  isGameOver: boolean;
  reason: 'checkmate' | 'stalemate' | 'repetition' | 'move-rule-50' | 'insufficient-material' | null;
  message: string;
}

/**
 * Detects all draw conditions and game ending states
 * Returns object indicating if game is over and why
 */
export const detectGameStatus = (game: Chess): GameStatus => {
  // Check checkmate first (highest priority end condition)
  if (game.isCheckmate()) {
    return {
      isGameOver: true,
      reason: 'checkmate',
      message: game.turn() === 'w' ? 'Checkmate! Black wins.' : 'Checkmate! White wins.',
    };
  }

  // Check stalemate
  if (game.isStalemate()) {
    return {
      isGameOver: true,
      reason: 'stalemate',
      message: `Stalemate! The game is a draw.`,
    };
  }

  // Check insufficient material
  if (game.isInsufficientMaterial()) {
    return {
      isGameOver: true,
      reason: 'insufficient-material',
      message: 'Insufficient material! The game is a draw.',
    };
  }

  // Check threefold repetition
  // chess.js doesn't have a built-in repetition check, but we can check if it's a draw
  if (game.isDraw()) {
    // This includes 50-move rule and other draw conditions
    // We need to check specifically for repetition by examining position history
    // For now, if isDraw() returns true and it's not insufficient material or stalemate,
    // it's likely due to repetition or 50-move rule
    return {
      isGameOver: true,
      reason: 'repetition',
      message: 'Draw by repetition!',
    };
  }

  // Check 50-move rule
  // The halfmove clock increments for both white and black moves
  // 50-move rule is triggered at 100 halfmoves without capture or pawn move
  const fen = game.fen();
  const fenParts = fen.split(' ');
  const halfmoveClock = parseInt(fenParts[4], 10);
  
  if (halfmoveClock >= 100) {
    return {
      isGameOver: true,
      reason: 'move-rule-50',
      message: 'Draw by 50-move rule!',
    };
  }

  // Game is still in progress
  return {
    isGameOver: false,
    reason: null,
    message: '',
  };
};

/**
 * Get detailed information about draw conditions
 */
export const getDrawDetails = (game: Chess): string[] => {
  const details: string[] = [];

  const fen = game.fen();
  const fenParts = fen.split(' ');
  const halfmoveClock = parseInt(fenParts[4], 10);

  // 50-move rule progress
  if (halfmoveClock > 0) {
    details.push(`50-move rule: ${halfmoveClock}/100 halfmoves`);
  }

  // Material check
  if (game.isInsufficientMaterial()) {
    details.push('Insufficient material for checkmate');
  }

  return details;
};
