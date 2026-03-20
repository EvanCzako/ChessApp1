import React from 'react';
import '../styles/PromotionDialog.css';

interface PromotionDialogProps {
  isOpen: boolean;
  pawnColor: 'white' | 'black';
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
}

export const PromotionDialog: React.FC<PromotionDialogProps> = ({
  isOpen,
  pawnColor,
  onSelect,
}) => {
  if (!isOpen) return null;

  const pieces = [
    { type: 'q', label: 'Queen' },
    { type: 'r', label: 'Rook' },
    { type: 'b', label: 'Bishop' },
    { type: 'n', label: 'Knight' },
  ] as const;

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
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
