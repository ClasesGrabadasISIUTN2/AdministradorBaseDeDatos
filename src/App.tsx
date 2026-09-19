import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar, TabType } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { AlumnosView } from './components/AlumnosView';
import { ReservasView } from './components/ReservasView';
import { ClasesPendientesView } from './components/ClasesPendientesView';
import { PagosView } from './components/PagosView';
import { DatabaseView } from './components/DatabaseView';
import { AlumnoModal } from './components/AlumnoModal';
import { AlumnoFichaModal } from './components/AlumnoFichaModal';
import { CargarPackModal } from './components/CargarPackModal';
import { CambiarClaveModal } from './components/CambiarClaveModal';
import { ReservaModal } from './components/ReservaModal';
import { CancelarReservaModal } from './components/CancelarReservaModal';
import { RegistrarPagoModal } from './components/RegistrarPagoModal';
import { api } from './services/api';
import { Alumno, Reserva, DashboardStats, DatabaseStatus } from './types';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { ThemeId, getInitialTheme, applyTheme, THEMES, getNextTheme } from './utils/theme';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');

  // Visual Theme State
  const [theme, setTheme] = useState<ThemeId>(() => {
    const initial = getInitialTheme();
    applyTheme(initial);
    return initial;
  });

  const handleThemeChange = useCallback((newTheme: ThemeId) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    const themeName = THEMES.find((t) => t.id === newTheme)?.name || newTheme;
    showToast(`Estilo de página cambiado a: ${themeName}`, 'success');
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Atajo de teclado global: Shift + Espacio para rotar temas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Evitar interrumpir si el usuario está escribiendo texto en inputs, textareas o contentEditable
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target?.isContentEditable
      ) {
        return;
      }

      // Shift + Espacio
      if (e.shiftKey && (e.code === 'Space' || e.key === ' ' || e.keyCode === 32)) {
        e.preventDefault();
        setTheme((prevTheme) => {
          const next = getNextTheme(prevTheme);
          applyTheme(next);
          const themeName = THEMES.find((t) => t.id === next)?.name || next;
          showToast(`Estilo visual: ${themeName} (Shift + Espacio)`, 'success');
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Data State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [clasesPendientes, setClasesPendientes] = useState<Reserva[]>([]);
  const [pagosData, setPagosData] = useState<{ deudasPorAlumno: any[]; pagosRecientes: Reserva[] }>({
    deudasPorAlumno: [],
    pagosRecientes: [],
  });
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Modals State
  const [isAlumnoModalOpen, setIsAlumnoModalOpen] = useState(false);
  const [selectedAlumnoParaEditar, setSelectedAlumnoParaEditar] = useState<Alumno | null>(null);

  const [isFichaModalOpen, setIsFichaModalOpen] = useState(false);
  const [selectedAlumnoParaFicha, setSelectedAlumnoParaFicha] = useState<Alumno | null>(null);

  const [isCargarPackModalOpen, setIsCargarPackModalOpen] = useState(false);
  const [selectedAlumnoParaPack, setSelectedAlumnoParaPack] = useState<Alumno | null>(null);

  const [isCambiarClaveModalOpen, setIsCambiarClaveModalOpen] = useState(false);
  const [selectedAlumnoParaClave, setSelectedAlumnoParaClave] = useState<Alumno | null>(null);

  const [isReservaModalOpen, setIsReservaModalOpen] = useState(false);
  const [selectedReservaParaEditar, setSelectedReservaParaEditar] = useState<Reserva | null>(null);

  const [isCancelarReservaModalOpen, setIsCancelarReservaModalOpen] = useState(false);
  const [selectedReservaParaCancelar, setSelectedReservaParaCancelar] = useState<Reserva | null>(null);

  const [isRegistrarPagoModalOpen, setIsRegistrarPagoModalOpen] = useState(false);
  const [preselectedAlumnoIdParaPago, setPreselectedAlumnoIdParaPago] = useState<number | null>(null);

  // Fetch all core data
  const loadAllData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [st, al, res, cp, pg, db] = await Promise.all([
        api.getStats().catch(() => null),
        api.getAlumnos().catch(() => []),
        api.getReservas().catch(() => []),
        api.getClasesPendientes().catch(() => []),
        api.getPagos().catch(() => ({ deudasPorAlumno: [], pagosRecientes: [] })),
        api.getDbStatus().catch(() => null),
      ]);

      if (st) setStats(st);
      if (al) setAlumnos(al);
      if (res) setReservas(res);
      if (cp) setClasesPendientes(cp);
      if (pg) setPagosData(pg);
      if (db) setDbStatus(db);
    } catch (err: any) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Alumno Handlers
  const handleOpenNuevoAlumno = () => {
    setSelectedAlumnoParaEditar(null);
    setIsAlumnoModalOpen(true);
  };

  const handleEditarAlumno = (alumno: Alumno) => {
    setSelectedAlumnoParaEditar(alumno);
    setIsAlumnoModalOpen(true);
  };

  const handleVerAlumno = (alumno: Alumno) => {
    setSelectedAlumnoParaFicha(alumno);
    setIsFichaModalOpen(true);
  };

  const handleVerAlumnoPorId = (alumnoId: number) => {
    const al = alumnos.find((a) => a.id === alumnoId);
    if (al) {
      setSelectedAlumnoParaFicha(al);
      setIsFichaModalOpen(true);
    }
  };

  const handleSaveAlumno = async (data: Partial<Alumno>) => {
    if (selectedAlumnoParaEditar) {
      await api.updateAlumno(selectedAlumnoParaEditar.id, data);
      showToast('Datos del alumno actualizados con éxito');
    } else {
      await api.createAlumno(data);
      showToast('Nuevo alumno registrado con éxito');
    }
    await loadAllData(true);
  };

  const handleEliminarAlumno = async (alumno: Alumno) => {
    if (
      window.confirm(
        `¿Confirmas la eliminación del alumno ${alumno.nombre} ${alumno.apellido || ''}? Esta acción borrará también sus reservas asociadas.`
      )
    ) {
      try {
        await api.deleteAlumno(alumno.id);
        showToast('Alumno eliminado correctamente');
        await loadAllData(true);
      } catch (err: any) {
        showToast('Error al eliminar alumno: ' + err.message, 'error');
      }
    }
  };

  const handleOpenCargarPack = (alumnoOrId?: Alumno | number) => {
    if (typeof alumnoOrId === 'number') {
      const found = alumnos.find((a) => a.id === alumnoOrId);
      setSelectedAlumnoParaPack(found || alumnos[0] || null);
    } else {
      setSelectedAlumnoParaPack(alumnoOrId || alumnos[0] || null);
    }
    setIsCargarPackModalOpen(true);
  };

  const handleOpenCambiarClave = (alumno: Alumno) => {
    setSelectedAlumnoParaClave(alumno);
    setIsCambiarClaveModalOpen(true);
  };

  // Reserva Handlers
  const handleOpenNuevaReserva = () => {
    setSelectedReservaParaEditar(null);
    setIsReservaModalOpen(true);
  };

  const handleEditarReserva = (reserva: Reserva) => {
    setSelectedReservaParaEditar(reserva);
    setIsReservaModalOpen(true);
  };

  const handleSaveReserva = async (data: any) => {
    if (selectedReservaParaEditar) {
      await api.updateReserva(selectedReservaParaEditar.id, data);
      showToast('Reserva actualizada correctamente');
    } else {
      await api.createReserva(data);
      showToast('Nueva reserva agendada con éxito');
    }
    await loadAllData(true);
  };

  const handleOpenCancelarReserva = (reserva: Reserva) => {
    setSelectedReservaParaCancelar(reserva);
    setIsCancelarReservaModalOpen(true);
  };

  const handleEliminarReserva = async (reservaId: number) => {
    if (window.confirm('¿Confirmas que deseas eliminar esta reserva de la base de datos?')) {
      try {
        await api.deleteReserva(reservaId);
        showToast('Reserva eliminada con éxito');
        await loadAllData(true);
      } catch (err: any) {
        showToast('Error al eliminar reserva: ' + err.message, 'error');
      }
    }
  };

  const handleMarcarPagadaDirecto = async (reservaId: number, alumnoId: number) => {
    try {
      await api.registrarPago([reservaId], alumnoId);
      showToast('Pago registrado y clase marcada como pagada');
      await loadAllData(true);
    } catch (err: any) {
      showToast('Error registrando pago: ' + err.message, 'error');
    }
  };

  // Pagos Handlers
  const handleOpenRegistrarPago = (alumnoId?: number) => {
    setPreselectedAlumnoIdParaPago(alumnoId || null);
    setIsRegistrarPagoModalOpen(true);
  };

  const badgeCounts = {
    alumnosTotal: alumnos.length,
    clasesPendientes: clasesPendientes.length,
    alumnosConDeuda: stats?.alumnosConDeuda ?? pagosData.deudasPorAlumno.length,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200 bg-slate-900/95 backdrop-blur">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="text-slate-200">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <Header
        dbStatus={dbStatus}
        onRefresh={() => loadAllData(false)}
        isRefreshing={refreshing}
        onOpenDbConfig={() => setCurrentTab('database')}
        theme={theme}
        onThemeChange={handleThemeChange}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          badgeCounts={badgeCounts}
          theme={theme}
          onThemeChange={handleThemeChange}
        />

        {/* Content View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Cargando datos de la base de datos...</p>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  stats={stats}
                  alumnos={alumnos}
                  reservas={reservas}
                  clasesPendientes={clasesPendientes}
                  onNavigate={setCurrentTab}
                  onOpenNuevoAlumno={handleOpenNuevoAlumno}
                  onOpenNuevaReserva={handleOpenNuevaReserva}
                  onOpenRegistrarPago={handleOpenRegistrarPago}
                  onOpenHabilitarPack={handleOpenCargarPack}
                  onVerAlumno={handleVerAlumno}
                />
              )}

              {currentTab === 'alumnos' && (
                <AlumnosView
                  alumnos={alumnos}
                  onOpenNuevoAlumno={handleOpenNuevoAlumno}
                  onEditarAlumno={handleEditarAlumno}
                  onVerAlumno={handleVerAlumno}
                  onCargarPack={handleOpenCargarPack}
                  onCobrar={(a) => handleOpenRegistrarPago(a.id)}
                  onCambiarClave={handleOpenCambiarClave}
                  onEliminarAlumno={handleEliminarAlumno}
                />
              )}

              {currentTab === 'reservas' && (
                <ReservasView
                  reservas={reservas}
                  alumnos={alumnos}
                  onOpenNuevaReserva={handleOpenNuevaReserva}
                  onEditarReserva={handleEditarReserva}
                  onCancelarReserva={handleOpenCancelarReserva}
                  onMarcarPagada={handleMarcarPagadaDirecto}
                  onEliminarReserva={handleEliminarReserva}
                  onVerAlumnoPorId={handleVerAlumnoPorId}
                />
              )}

              {currentTab === 'clases' && (
                <ClasesPendientesView
                  clases={clasesPendientes}
                  alumnos={alumnos}
                  onOpenNuevaReserva={handleOpenNuevaReserva}
                  onMarcarPagada={handleMarcarPagadaDirecto}
                  onVerAlumnoPorId={handleVerAlumnoPorId}
                />
              )}

              {currentTab === 'pagos' && (
                <PagosView
                  pagosData={pagosData}
                  alumnos={alumnos}
                  onOpenRegistrarPago={handleOpenRegistrarPago}
                  onOpenHabilitarPack={handleOpenCargarPack}
                  onVerAlumnoPorId={handleVerAlumnoPorId}
                />
              )}

              {currentTab === 'database' && (
                <DatabaseView
                  dbStatus={dbStatus}
                  onRefreshStatus={() => loadAllData(false)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <AlumnoModal
        isOpen={isAlumnoModalOpen}
        onClose={() => setIsAlumnoModalOpen(false)}
        onSave={handleSaveAlumno}
        alumno={selectedAlumnoParaEditar}
      />

      <AlumnoFichaModal
        isOpen={isFichaModalOpen}
        onClose={() => setIsFichaModalOpen(false)}
        alumno={selectedAlumnoParaFicha}
        onEditar={handleEditarAlumno}
        onCargarPack={handleOpenCargarPack}
        onCobrar={(a) => handleOpenRegistrarPago(a.id)}
        onCambiarClave={handleOpenCambiarClave}
        onReservasChange={() => loadAllData(true)}
      />

      <CargarPackModal
        isOpen={isCargarPackModalOpen}
        onClose={() => setIsCargarPackModalOpen(false)}
        alumno={selectedAlumnoParaPack}
        onSuccess={() => {
          showToast('Pack de horas acreditado exitosamente');
          loadAllData(true);
        }}
      />

      <CambiarClaveModal
        isOpen={isCambiarClaveModalOpen}
        onClose={() => setIsCambiarClaveModalOpen(false)}
        alumno={selectedAlumnoParaClave}
        onSuccess={() => {
          showToast('Contraseña modificada correctamente');
          loadAllData(true);
        }}
      />

      <ReservaModal
        isOpen={isReservaModalOpen}
        onClose={() => setIsReservaModalOpen(false)}
        onSave={handleSaveReserva}
        reserva={selectedReservaParaEditar}
        alumnos={alumnos}
      />

      <CancelarReservaModal
        isOpen={isCancelarReservaModalOpen}
        onClose={() => setIsCancelarReservaModalOpen(false)}
        reserva={selectedReservaParaCancelar}
        onSuccess={() => {
          showToast('Reserva cancelada correctamente');
          loadAllData(true);
        }}
      />

      <RegistrarPagoModal
        isOpen={isRegistrarPagoModalOpen}
        onClose={() => setIsRegistrarPagoModalOpen(false)}
        alumnos={alumnos}
        preselectedAlumnoId={preselectedAlumnoIdParaPago}
        onSuccess={() => {
          showToast('Pago registrado correctamente');
          loadAllData(true);
        }}
      />
    </div>
  );
}
