import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface SegmentedControlProps<T extends string> {
  options: { id: T; label: string; badge?: number }[];
  selected: T;
  onChange: (id: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  selected,
  onChange,
}: SegmentedControlProps<T>) {
  const { isDark } = useTheme();

  return (
    <div
      className={`p-1 rounded-[14px] flex items-center w-full transition-all ${
        isDark
          ? 'bg-[#1C1C1E] border border-white/[0.08]'
          : 'bg-[#E3E3E8] border border-black/[0.04]'
      }`}
    >
      {options.map((option) => {
        const isSelected = selected === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`flex-1 py-2 px-3 rounded-[10px] text-[14px] font-medium transition-all duration-200 flex items-center justify-center gap-2 select-none active:scale-[0.98] ${
              isSelected
                ? isDark
                  ? 'bg-[#2C2C2E] text-white shadow-[0_2px_8px_rgba(0,0,0,0.5)] font-semibold'
                  : 'bg-white text-black shadow-[0_2px_8px_rgba(0,0,0,0.12)] font-semibold'
                : isDark
                ? 'text-[#8E8E93] hover:text-white hover:bg-white/[0.02]'
                : 'text-[#636366] hover:text-black hover:bg-black/[0.02]'
            }`}
          >
            <span>{option.label}</span>
            {option.badge !== undefined && option.badge > 0 && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold shadow-xs ${
                  isDark
                    ? 'bg-[#A390E4] text-black'
                    : 'bg-[#7C65C1] text-white'
                }`}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
