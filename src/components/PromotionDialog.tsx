import React from 'react';
import '../styles/PromotionDialog.css';

interface PromotionDialogProps {
  isOpen: boolean;
  pawnColor: 'white' | 'black';
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
}

const PIECE_TYPE_MAP: { [key: string]: string } = {
  'q': 'queen',
  'r': 'rook',
  'b': 'bishop',
  'n': 'knight',
};

const getPieceImage = (type: string, color: string) => {
  const pieceType = PIECE_TYPE_MAP[type];
  const colorSuffix = color === 'white' ? 'w' : 'b';
  return new URL(`../assets/pieces/${pieceType}-${colorSuffix}.svg`, import.meta.url).href;
};

export const PromotionDialog: React.FC<PromotionDialogProps> = ({
  isOpen,
  pawnColor,
  onSelect,
}) => {
  if (!isOpen) return null;

  const pieces = [
    { type: 'q' as const, label: 'Queen' },
    { type: 'r' as const, label: 'Rook' },
    { type: 'b' as const, label: 'Bishop' },
    { type: 'n' as const, label: 'Knight' },
  ];

  return (
    <div className="promotion-overlay">
      <div className="promotion-dialog">
        <h3>Select promotion piece</h3>
        <div className="promotion-buttons">
          {pieces.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className={`promotion-btn ${pawnColor}`}
              title={label}
            >
              <img 
                src={getPieceImage(type, pawnColor)} 
                alt={label}
                className="promotion-piece-image"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
