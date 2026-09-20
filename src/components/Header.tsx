import React from 'react';
import { RefreshCw, ShieldCheck, LogOut, ArrowLeft, ArrowRight } from 'lucide-react';
import { DatabaseStatus } from '../types';
import { ThemeSelector } from './ThemeSelector';
import { ThemeId } from '../utils/theme';

interface HeaderProps {
  dbStatus: DatabaseStatus | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenDbConfig?: () => void;
  theme: ThemeId;
  onThemeChange: (themeId: ThemeId) => void;
  onLogout?: () => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  previousTabName?: string;
  canGoForward?: boolean;
  onGoForward?: () => void;
  nextTabName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  dbStatus,
  onRefresh,
  isRefreshing,
  onOpenDbConfig,
  theme,
  onThemeChange,
  onLogout,
  canGoBack = false,
  onGoBack,
  previousTabName,
  canGoForward = false,
  onGoForward,
  nextTabName,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-2.5">
          {/* Navigation Arrow: Volver atrás */}
          {canGoBack && onGoBack && (
            <button
              onClick={onGoBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white text-xs font-semibold shadow-xs transition group cursor-pointer"
              title={previousTabName ? `Volver a ${previousTabName}` : 'Volver a la sección anterior'}
              aria-label="Volver atrás"
            >
              <ArrowLeft className="w-4 h-4 text-blue-400 group-hover:-translate-x-0.5 transition-transform" />
              <span className="inline font-medium">Volver</span>
              {previousTabName && (
                <span className="hidden md:inline text-slate-400 font-normal">
                  ({previousTabName})
                </span>
              )}
            </button>
          )}

          {/* Navigation Arrow: Avanzar (si volvió atrás) */}
          {canGoForward && onGoForward && (
            <button
              onClick={onGoForward}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium shadow-xs transition group cursor-pointer"
              title={nextTabName ? `Avanzar a ${nextTabName}` : 'Avanzar'}
              aria-label="Avanzar"
            >
              <span className="hidden sm:inline">Avanzar</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-lg shadow-sm">
            U
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg text-slate-100 tracking-tight">
                Panel de Administración
              </h1>
              <span className="hidden md:inline-block px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-blue-900/60 text-blue-300 border border-blue-700/50 rounded-full">
                UTN FRSF
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Gestión Integral de Alumnos, Reservas, Pagos y Clases
            </p>
          </div>
        </div>

        {/* Mobile controls: Theme button & Refresh */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeSelector
            currentTheme={theme}
            onThemeChange={onThemeChange}
            compact
          />
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-slate-100"
            title="Actualizar datos"
            aria-label="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 hover:bg-rose-900/60 transition"
              title="Bloquear acceso / Salir"
              aria-label="Bloquear acceso / Salir"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
        {/* Style Selector Button (Desktop / Tablet) */}
        <ThemeSelector
          currentTheme={theme}
          onThemeChange={onThemeChange}
        />

        {/* Desktop Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-slate-100 text-xs font-medium transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          <span>Actualizar</span>
        </button>

        {/* Admin identifier */}
        <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-800 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span className="font-mono text-slate-300 truncate max-w-[210px]">
            clasesparticularesutnfrsf
          </span>
        </div>

        {/* Logout / Bloquear Acceso Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-700/70 hover:border-rose-800/80 text-slate-400 text-xs font-medium transition"
            title="Bloquear panel y requerir código TOTP"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        )}
      </div>
    </header>
  );
};

