import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  Check,
  ChevronDown,
  Sun,
  Moon,
  Sparkles,
  Flame,
  Shield,
  Sunset,
  ArrowRight,
  X,
} from 'lucide-react';
import { THEMES, ThemeId, ThemeConfig, getNextTheme } from '../utils/theme';

interface ThemeSelectorProps {
  currentTheme: ThemeId;
  onThemeChange: (themeId: ThemeId) => void;
  compact?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onThemeChange,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeTheme = THEMES.find((t) => t.id === currentTheme) || THEMES[0];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleNextTheme = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = getNextTheme(currentTheme);
    onThemeChange(next);
  };

  const getThemeIcon = (id: ThemeId) => {
    switch (id) {
      case 'slate':
        return <Moon className="w-4 h-4 text-blue-400" />;
      case 'nordic':
        return <Sun className="w-4 h-4 text-sky-400" />;
      case 'obsidian':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'crimson':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'titanium':
        return <Shield className="w-4 h-4 text-cyan-400" />;
      case 'sunset':
        return <Sunset className="w-4 h-4 text-orange-400" />;
      default:
        return <Palette className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        id="theme-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-lg border transition shadow-sm ${
          compact
            ? 'p-2 bg-slate-800/90 border-slate-700 text-slate-200 hover:text-slate-100 hover:bg-slate-700'
            : 'px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 text-slate-200 hover:text-slate-100 text-xs font-medium'
        }`}
        title={`Estilo visual actual: ${activeTheme.name}. Pulsa Shift + Espacio para rotar entre temas.`}
        aria-label="Cambiar estilo de la página (Shift + Espacio)"
      >
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 shadow-sm shrink-0"
            style={{ backgroundColor: activeTheme.colors.accent }}
          />
          <Palette className="w-3.5 h-3.5 text-slate-300" />
        </div>

        {!compact && (
          <>
            <span className="hidden sm:inline text-slate-400">Estilo:</span>
            <span className="font-semibold text-slate-100 truncate max-w-[110px]">
              {activeTheme.name}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </>
        )}
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          id="theme-dropdown-popover"
          className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[85vh] overflow-y-auto z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3.5 animate-in fade-in zoom-in-95 duration-150 text-slate-100"
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-100">
                  Estilos de la Página
                </h3>
                <p className="text-[11px] text-slate-400">
                  Cambia la apariencia y los colores del panel
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              aria-label="Cerrar selector de estilos"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick cycle button */}
          <div className="mb-3">
            <button
              onClick={() => handleNextTheme()}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-semibold transition"
            >
              <div className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-blue-400" />
                <span>Alternar al siguiente estilo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-blue-300">
                  Shift + Espacio
                </kbd>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>

          {/* Theme Options Grid */}
          <div className="space-y-2">
            {THEMES.map((theme) => {
              const isSelected = theme.id === currentTheme;
              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    onThemeChange(theme.id);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-slate-800/90 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                      : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-700/60 hover:border-slate-600 text-slate-300'
                  }`}
                >
                  {/* Theme Color Palette Preview Box */}
                  <div
                    className="w-12 h-12 rounded-lg shrink-0 p-1.5 flex flex-col justify-between border shadow-inner"
                    style={{
                      backgroundColor: theme.colors.bg,
                      borderColor: theme.id === 'nordic' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)',
                    }}
                  >
                    <div
                      className="h-3.5 rounded flex items-center px-1 justify-between shadow-xs"
                      style={{ backgroundColor: theme.colors.card }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                      <span
                        className="w-3 h-0.5 rounded-full"
                        style={{ backgroundColor: theme.colors.text, opacity: 0.7 }}
                      />
                    </div>
                    <div className="flex gap-0.5 justify-end">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                    </div>
                  </div>

                  {/* Theme Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1.5">
                        {getThemeIcon(theme.id)}
                        <span className="font-semibold text-xs text-slate-100 truncate">
                          {theme.name}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-slate-700/60 text-slate-300 border-slate-600/50'
                        }`}
                      >
                        {theme.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 leading-snug">
                      {theme.description}
                    </p>
                  </div>

                  {/* Check icon if selected */}
                  {isSelected && (
                    <div className="shrink-0 self-center p-1 bg-blue-600 text-white rounded-full">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Se guarda en tu navegador</span>
            <span className="font-mono text-[10px] text-slate-500 uppercase">
              {activeTheme.id}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
