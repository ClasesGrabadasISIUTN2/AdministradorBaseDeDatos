import React, { useState, useMemo } from 'react';
import {
  Clock,
  Calendar,
  User,
  Users,
  CheckCircle,
  Phone,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  PlusCircle,
} from 'lucide-react';
import { Reserva, Alumno } from '../types';
import { formatearFecha, getDiasDiferenciaHoy } from '../utils/date';

interface ClasesPendientesViewProps {
  clases: Reserva[];
  alumnos: Alumno[];
  onOpenNuevaReserva: () => void;
  onMarcarPagada: (reservaId: number, alumnoId: number) => void;
  onVerAlumnoPorId: (alumnoId: number) => void;
}

export const ClasesPendientesView: React.FC<ClasesPendientesViewProps> = ({
  clases,
  alumnos,
  onOpenNuevaReserva,
  onMarcarPagada,
  onVerAlumnoPorId,
}) => {
  const [timelineFilter, setTimelineFilter] = useState<'todas' | 'hoy' | 'semana' | 'siguiente'>('todas');

  const getDayDiff = (dateStr: string | null) => {
    return getDiasDiferenciaHoy(dateStr);
  };

  const filteredClases = useMemo(() => {
    return clases.filter((c) => {
      const diff = getDayDiff(c.fecha_realizado);
      if (timelineFilter === 'hoy') return diff === 0;
      if (timelineFilter === 'semana') return diff >= 0 && diff <= 7;
      if (timelineFilter === 'siguiente') return diff > 7;
      return true;
    });
  }, [clases, timelineFilter]);

  // Group classes by date
  const clasesAgrupadas = useMemo(() => {
    const grupos: Record<string, Reserva[]> = {};
    filteredClases.forEach((c) => {
      const f = c.fecha_realizado || 'Sin fecha';
      if (!grupos[f]) grupos[f] = [];
      grupos[f].push(c);
    });
    return grupos;
  }, [filteredClases]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">
            Agenda de Clases Pendientes y Próximas
          </h2>
          <p className="text-xs text-slate-400">
            Cronograma diario y semanal de clases particulares, consultas y entregas de TP.
          </p>
        </div>

        <button
          onClick={onOpenNuevaReserva}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Agendar Clase</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          onClick={() => setTimelineFilter('todas')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            timelineFilter === 'todas'
              ? 'bg-blue-600 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Todas las pendientes ({clases.length})
        </button>
        <button
          onClick={() => setTimelineFilter('hoy')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            timelineFilter === 'hoy'
              ? 'bg-blue-600 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Para Hoy
        </button>
        <button
          onClick={() => setTimelineFilter('semana')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            timelineFilter === 'semana'
              ? 'bg-blue-600 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Esta Semana (próximos 7 días)
        </button>
        <button
          onClick={() => setTimelineFilter('siguiente')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            timelineFilter === 'siguiente'
              ? 'bg-blue-600 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Más adelante (+7 días)
        </button>
      </div>

      {/* Grouped by Date Timeline */}
      {Object.keys(clasesAgrupadas).length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
          <CalendarDays className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-300">No hay clases agendadas en este período.</p>
          <p className="text-xs text-slate-400 mt-1">Usa el botón "+ Agendar Clase" para programar una nueva.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(clasesAgrupadas).map(([fecha, items]) => {
            const diff = getDayDiff(fecha);
            const esHoy = diff === 0;
            const esManana = diff === 1;

            return (
              <div key={fecha} className="space-y-3">
                {/* Date Heading Pill */}
                <div className="flex items-center gap-2.5">
                  <div
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      esHoy
                        ? 'bg-blue-600 text-white shadow-sm'
                        : esManana
                        ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {esHoy ? 'Hoy • ' : esManana ? 'Mañana • ' : ''}
                      {formatearFecha(fecha, { formatoLargo: true, conDiaSemanaCompleto: true, textoVacio: 'Sin fecha' })}
                    </span>
                  </div>
                  <div className="h-px bg-slate-800 flex-1" />
                  <span className="text-xs text-slate-400 font-mono">
                    {items.length} {items.length === 1 ? 'clase' : 'clases'}
                  </span>
                </div>

                {/* Grid of Class Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {items.map((clase) => {
                    const celdas = Array.isArray(clase.celdas) ? clase.celdas : [];
                    const alumno = alumnos.find((a) => a.id === clase.alumno_id);
                    const telefonoLimpio = alumno?.telefono?.replace(/\D/g, '') || '';
                    const fechaFormateada = formatearFecha(clase.fecha_realizado, { conDiaSemana: true });
                    const mensajeWsp = encodeURIComponent(
                      `Hola ${clase.alumno_nombre}! Te recordamos tu clase particular programada para el ${fechaFormateada} a las ${clase.horaInicio || 'horario pactado'} hs.`
                    );

                    return (
                      <div
                        key={clase.id}
                        className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex flex-col justify-between transition shadow-sm"
                      >
                        <div>
                          {/* Card Top: Time & Status */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-bold">
                              <Clock className="w-3.5 h-3.5 text-blue-400" />
                              <span>{clase.horaInicio || '10:00'} hs</span>
                              <span className="text-slate-400 font-normal">
                                ({celdas.length} hs)
                              </span>
                            </div>

                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                clase.estado === 'pack'
                                  ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                                  : clase.estado === 'pagada'
                                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                                  : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                              }`}
                            >
                              {clase.estado === 'pack'
                                ? 'Pack'
                                : clase.estado === 'pagada'
                                ? 'Pagada'
                                : 'Debe'}
                            </span>
                          </div>

                          {/* Student Info */}
                          <div className="space-y-1 mb-3">
                            <button
                              onClick={() => onVerAlumnoPorId(clase.alumno_id)}
                              className="font-bold text-slate-100 hover:text-blue-400 text-sm text-left truncate block transition"
                            >
                              {clase.alumno_nombre} {clase.alumno_apellido || ''}
                            </button>
                            <div className="text-xs text-slate-400">
                              {alumno?.materia || 'Materia no especificada'}
                            </div>
                            <div className="text-[11px] text-slate-400 capitalize">
                              Modalidad: {clase.tipo_clase?.replace('_', ' ') || 'Estándar'}
                            </div>
                          </div>

                          {/* Price */}
                          {clase.precio > 0 && (
                            <div className="flex items-center justify-between text-xs py-2 border-t border-slate-800/60 my-2">
                              <span className="text-slate-400">Tarifa asignada:</span>
                              <span className="font-mono font-bold text-slate-200">
                                {formatMoney(clase.precio)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Card Bottom Actions */}
                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800 mt-2">
                          {telefonoLimpio ? (
                            <a
                              href={`https://wa.me/${telefonoLimpio}?text=${mensajeWsp}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Recordatorio WhatsApp</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-mono">
                              #{clase.codigo}
                            </span>
                          )}

                          {clase.estado === 'debe' && (
                            <button
                              onClick={() => onMarcarPagada(clase.id, clase.alumno_id)}
                              className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition"
                            >
                              Cobrar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
