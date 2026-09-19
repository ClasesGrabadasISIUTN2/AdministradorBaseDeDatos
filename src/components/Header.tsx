import React from 'react';
import { Database, RefreshCw, ShieldCheck, AlertTriangle, ExternalLink } from 'lucide-react';
import { DatabaseStatus } from '../types';

interface HeaderProps {
  dbStatus: DatabaseStatus | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenDbConfig: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  dbStatus,
  onRefresh,
  isRefreshing,
  onOpenDbConfig,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-2.5">
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

        {/* Mobile refresh */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="sm:hidden p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
          title="Actualizar datos"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
        </button>
      </div>

      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
        {/* DB Connection Status Badge */}
        <button
          onClick={onOpenDbConfig}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            dbStatus?.connected
              ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/40'
              : 'bg-amber-950/40 border-amber-600/40 text-amber-300 hover:bg-amber-900/40'
          }`}
          title="Ver detalles de conexión a la Base de Datos"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                dbStatus?.connected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                dbStatus?.connected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>

          <Database className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-mono">
            {dbStatus?.connected
              ? `PostgreSQL (${dbStatus.latencyMs ?? 5}ms)`
              : 'Modo Sincronizado / Demo'}
          </span>
          <span className="sm:hidden">
            {dbStatus?.connected ? 'Postgres' : 'Demo'}
          </span>
        </button>

        {/* Desktop Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition"
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
      </div>
    </header>
  );
};
