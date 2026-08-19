import React from 'react';

interface SuggestionChipProps {
  label: string;
  isSelected?: boolean;
  onClick: () => void;
}

export const SuggestionChip: React.FC<SuggestionChipProps> = ({
  label,
  isSelected = false,
  onClick
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium tracking-wide transition-all duration-300 transform active:scale-95 border cursor-pointer select-none ${
        isSelected
          ? 'bg-terracotta border-terracotta text-cream shadow-sm'
          : 'bg-white border-[#7A7570]/15 text-charcoal hover:border-terracotta/40 hover:bg-cream'
      }`}
    >
      {label}
    </button>
  );
};
