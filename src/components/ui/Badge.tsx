import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface BadgeProps {
  type: 'Fundador' | 'Moderador' | 'Membro Ativo' | 'Visitante' | '1º grau' | '2º grau';
}

export const Badge: React.FC<BadgeProps> = ({ type }) => {
  const { isDark } = useTheme();

  switch (type) {
    case 'Fundador':
      return (
        <span
          className={`inline-flex items-center text-[12px] font-semibold px-2.5 py-0.5 rounded-full border ${
            isDark
              ? 'text-[#D2C7F5] bg-[#A390E4]/15 border-[#A390E4]/30'
              : 'text-[#5E47A3] bg-[#7C65C1]/12 border-[#7C65C1]/25'
          }`}
        >
          Fundador
        </span>
      );
    case 'Moderador':
      return (
        <span
          className={`inline-flex items-center text-[12px] font-semibold px-2.5 py-0.5 rounded-full border ${
            isDark
              ? 'text-[#E5B56A] bg-[#D4A359]/15 border-[#D4A359]/30'
              : 'text-[#8A6224] bg-[#D4A359]/15 border-[#D4A359]/25'
          }`}
        >
          Moderador
        </span>
      );
    case 'Membro Ativo':
      return (
        <span
          className={`inline-flex items-center text-[12px] font-semibold px-2.5 py-0.5 rounded-full border ${
            isDark
              ? 'text-[#30D158] bg-[#30D158]/15 border-[#30D158]/30'
              : 'text-[#1E7E34] bg-[#34C759]/15 border-[#34C759]/25'
          }`}
        >
          Membro Ativo
        </span>
      );
    case 'Visitante':
      return (
        <span
          className={`inline-flex items-center text-[12px] font-medium px-2.5 py-0.5 rounded-full border ${
            isDark
              ? 'text-[#8E8E93] bg-white/[0.06] border-white/[0.08]'
              : 'text-[#636366] bg-black/[0.05] border-black/[0.08]'
          }`}
        >
          Visitante
        </span>
      );
    case '1º grau':
      return (
        <span
          className={`inline-flex items-center text-[12px] font-semibold px-2.5 py-0.5 rounded-full border ${
            isDark
              ? 'text-[#D2C7F5] bg-[#A390E4]/15 border-[#A390E4]/30'
              : 'text-[#5E47A3] bg-[#7C65C1]/12 border-[#7C65C1]/25'
          }`}
        >
          1º grau
        </span>
      );
    case '2º grau':
      return (
        <span
          className={`inline-flex items-center text-[12px] font-medium px-2.5 py-0.5 rounded-full border ${
            isDark
              ? 'text-[#8E8E93] bg-white/[0.06] border-white/[0.08]'
              : 'text-[#636366] bg-black/[0.05] border-black/[0.08]'
          }`}
        >
          2º grau
        </span>
      );
  }
};
