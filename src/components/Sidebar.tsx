import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Clock,
  CreditCard,
  Database,
  Calendar,
  Palette,
  Sparkles,
} from 'lucide-react';
import { ThemeId, THEMES, getNextTheme } from '../utils/theme';

export type TabType = 'dashboard' | 'alumnos' | 'reservas' | 'clases' | 'pagos' | 'database';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  badgeCounts: {
    alumnosTotal: number;
    clasesPendientes: number;
    alumnosConDeuda: number;
  };
  theme?: ThemeId;
  onThemeChange?: (themeId: ThemeId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  badgeCounts,
  theme = 'slate',
  onThemeChange,
}) => {
  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Panel General',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'alumnos' as TabType,
      label: 'Alumnos / Usuarios',
      icon: Users,
      badge: badgeCounts.alumnosTotal,
      badgeColor: 'bg-slate-700 text-slate-300',
    },
    {
      id: 'reservas' as TabType,
      label: 'Todas las Reservas',
      icon: CalendarCheck,
      badge: null,
    },
    {
      id: 'clases' as TabType,
      label: 'Clases Pendientes',
      icon: Clock,
      badge: badgeCounts.clasesPendientes > 0 ? badgeCounts.clasesPendientes : null,
      badgeColor: 'bg-blue-900/70 text-blue-300 border border-blue-700/60',
    },
    {
      id: 'pagos' as TabType,
      label: 'Pagos & Deudas',
      icon: CreditCard,
      badge: badgeCounts.alumnosConDeuda > 0 ? badgeCounts.alumnosConDeuda : null,
      badgeColor: 'bg-rose-950/70 text-rose-300 border border-rose-800/60',
    },
    {
      id: 'database' as TabType,
      label: 'Base de Datos & SQL',
      icon: Database,
      badge: null,
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900/60 border-r border-slate-800/80 p-3 md:min-h-[calc(100vh-57px)] flex md:flex-col justify-between overflow-x-auto md:overflow-visible">
      <nav className="flex md:flex-col gap-1 w-full">
        <div className="hidden md:block px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Módulos de Gestión
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info in Sidebar */}
      <div className="hidden md:block pt-4 mt-4 border-t border-slate-800/60 px-3 text-xs text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Ciclo Lectivo Activo</span>
          </div>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-700/40">
            UTN FRSF
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
          Clases particulares, TP y consultas para materias de UTN FRSF.
        </p>

        {/* Quick Style Switcher in Sidebar */}
        {onThemeChange && (
          <div className="pt-3 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-[11px] mb-1.5 text-slate-400">
              <span>Estilo de página</span>
              <span className="text-slate-200 font-medium text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                {THEMES.find((t) => t.id === theme)?.name || theme}
              </span>
            </div>
            <button
              onClick={() => onThemeChange(getNextTheme(theme))}
              className="w-full flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-slate-100 text-xs font-medium transition shadow-xs"
              title="Cambiar al siguiente estilo visual"
            >
              <Palette className="w-3.5 h-3.5 text-blue-400" />
              <span>Cambiar estilo</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
