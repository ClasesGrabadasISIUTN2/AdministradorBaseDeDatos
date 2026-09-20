import React from 'react';
import {
  Users,
  Clock,
  AlertCircle,
  TrendingUp,
  Package,
  UserPlus,
  PlusCircle,
  CreditCard,
  ArrowRight,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import { DashboardStats, Alumno, Reserva } from '../types';
import { formatearFecha } from '../utils/date';

interface DashboardViewProps {
  stats: DashboardStats | null;
  alumnos: Alumno[];
  reservas: Reserva[];
  clasesPendientes: Reserva[];
  onNavigate: (tab: any) => void;
  onOpenNuevoAlumno: () => void;
  onOpenNuevaReserva: () => void;
  onOpenRegistrarPago: (alumnoId?: number) => void;
  onOpenHabilitarPack: (alumnoId?: number) => void;
  onVerAlumno: (alumno: Alumno) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  alumnos,
  reservas,
  clasesPendientes,
  onNavigate,
  onOpenNuevoAlumno,
  onOpenNuevaReserva,
  onOpenRegistrarPago,
  onOpenHabilitarPack,
  onVerAlumno,
}) => {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const deudores = alumnos
    .filter((a) => (a.deudaTotal || 0) > 0)
    .sort((a, b) => (b.deudaTotal || 0) - (a.deudaTotal || 0));

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            Panel de Control General
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Supervisión en tiempo real de alumnos, reservas, ingresos y agenda académica.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onOpenNuevoAlumno}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Alumno</span>
          </button>
          <button
            onClick={onOpenNuevaReserva}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nueva Reserva</span>
          </button>
          <button
            onClick={() => onOpenRegistrarPago()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Registrar Pago</span>
          </button>
          <button
            onClick={() => onOpenHabilitarPack()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <Package className="w-4 h-4 text-blue-400" />
            <span>Cargar Pack</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Alumnos */}
        <div
          onClick={() => onNavigate('alumnos')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Alumnos</span>
            <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-800/40 text-blue-400 group-hover:scale-105 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {stats?.totalAlumnos ?? alumnos.length}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Registrados</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition" />
          </div>
        </div>

        {/* Clases Pendientes */}
        <div
          onClick={() => onNavigate('clases')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Clases Próximas</span>
            <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 group-hover:scale-105 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-300 font-mono">
            {stats?.clasesPendientes ?? clasesPendientes.length}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>{stats?.clasesHoy ?? 0} para hoy</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition" />
          </div>
        </div>

        {/* Total Deuda */}
        <div
          onClick={() => onNavigate('pagos')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Deuda por Cobrar</span>
            <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-400 group-hover:scale-105 transition">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-rose-400 font-mono truncate">
            {formatMoney(stats?.totalDeudaCalculada ?? 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>{stats?.alumnosConDeuda ?? deudores.length} alumnos</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400 transition" />
          </div>
        </div>

        {/* Horas Pack en Alumnos */}
        <div
          onClick={() => onNavigate('alumnos')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Horas en Packs</span>
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 group-hover:scale-105 transition">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono">
            {stats?.totalHorasPackActivas ?? 0} hs
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>A favor de alumnos</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition" />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Upcoming Classes + Top Debtors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Classes Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-slate-100 text-base">
                  Próximas Clases Agendadas
                </h3>
              </div>
              <button
                onClick={() => onNavigate('clases')}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                <span>Ver agenda</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-800/80 mt-3">
              {clasesPendientes.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  No hay clases pendientes programadas para los próximos días.
                </div>
              ) : (
                clasesPendientes.slice(0, 5).map((clase) => (
                  <div
                    key={clase.id}
                    className="py-3 flex items-center justify-between gap-3 text-sm hover:bg-slate-800/30 px-2 rounded-lg transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 truncate">
                          {clase.alumno_nombre} {clase.alumno_apellido || ''}
                        </span>
                        <span
                          className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${
                            clase.estado === 'pack'
                              ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                              : clase.estado === 'pagada'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                              : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                          }`}
                        >
                          {clase.estado === 'pack' ? 'Pack' : clase.estado === 'pagada' ? 'Pagada' : 'Debe'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-slate-300">
                          {formatearFecha(clase.fecha_realizado, { conDiaSemana: true })}
                        </span>
                        {clase.horaInicio && (
                          <>
                            <span>•</span>
                            <span>{clase.horaInicio} hs</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="truncate">{clase.tipo_clase || 'Clase individual'}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {clase.precio > 0 && (
                        <div className="font-mono text-xs font-semibold text-slate-300">
                          {formatMoney(clase.precio)}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400 font-mono">
                        {clase.codigo}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Mostrando próximas 5 de {clasesPendientes.length} clases</span>
            <button
              onClick={onOpenNuevaReserva}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              + Agendar nueva clase
            </button>
          </div>
        </div>

        {/* Alumnos con Deuda Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <h3 className="font-semibold text-slate-100 text-base">
                  Alumnos con Deuda Pendiente
                </h3>
              </div>
              <button
                onClick={() => onNavigate('pagos')}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
              >
                <span>Ver gestión de pagos</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-800/80 mt-3">
              {deudores.length === 0 ? (
                <div className="py-8 text-center text-sm text-emerald-400 flex flex-col items-center gap-1.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <span>¡Excelente! No hay alumnos con saldos adeudados pendientes.</span>
                </div>
              ) : (
                deudores.slice(0, 5).map((alumno) => (
                  <div
                    key={alumno.id}
                    className="py-3 flex items-center justify-between gap-3 text-sm hover:bg-slate-800/30 px-2 rounded-lg transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onVerAlumno(alumno)}
                          className="font-semibold text-slate-200 hover:text-blue-400 text-left truncate"
                        >
                          {alumno.nombre} {alumno.apellido || ''}
                        </button>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-rose-950/70 text-rose-300 border border-rose-800/60">
                          {alumno.condicion_pago === 'Mora' ? 'Deudor' : (alumno.condicion_pago || 'Deudor')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="truncate">{alumno.materia || 'Sin materia asignada'}</span>
                        {alumno.telefono && (
                          <a
                            href={`https://wa.me/${alumno.telefono.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-400 hover:underline flex items-center gap-1"
                            title="Contactar por WhatsApp"
                          >
                            <Phone className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <div className="font-mono text-sm font-bold text-rose-400">
                          {formatMoney(alumno.deudaTotal || 0)}
                        </div>
                        <div className="text-[10px] text-slate-400">Total + Mora</div>
                      </div>
                      <button
                        onClick={() => onOpenRegistrarPago(alumno.id)}
                        className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded text-xs font-semibold transition"
                      >
                        Cobrar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Mostrando {Math.min(5, deudores.length)} de {deudores.length} alumnos con mora</span>
            <button
              onClick={() => onNavigate('pagos')}
              className="text-rose-400 hover:text-rose-300 font-medium"
            >
              Ver desglose de deudas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
