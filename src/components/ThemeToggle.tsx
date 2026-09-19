import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'icon' | 'segmented' | 'compact';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'icon', className = '' }) => {
  const { theme, isDark, toggleTheme, setTheme } = useTheme();

  if (variant === 'segmented') {
    return (
      <div className={`flex items-center rounded-xl bg-[#141620] border border-[#232733] p-1 ${className}`}>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            isDark
              ? 'bg-[#1e2230] text-[#f5d77f] border border-[#d4af37]/40 shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
          title="Ativar Modo Escuro"
        >
          <Moon className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Modo Escuro</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            !isDark
              ? 'bg-white text-[#996515] border border-amber-300 shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
          title="Ativar Modo Claro"
        >
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Modo Claro</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-[#2e3344] bg-[#161822] text-white shadow-md hover:border-[#d4af37] transition active:scale-95 cursor-pointer ${className}`}
      title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
      aria-label={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-[#f5d77f] hover:text-[#d4af37] transition transform hover:rotate-45 duration-300" />
      ) : (
        <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4af37] hover:text-[#f5d77f] transition transform hover:-rotate-12 duration-300" />
      )}
    </button>
  );
};
