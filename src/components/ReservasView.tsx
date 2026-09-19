import React, { useState, useMemo } from 'react';
import {
  Search,
  PlusCircle,
  Calendar,
  CalendarRange,
  Clock,
  User,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  CreditCard,
  Edit2,
  DollarSign,
  Phone,
  X,
} from 'lucide-react';
import { Reserva, Alumno } from '../types';
import { formatearFecha, getDiasDiferenciaHoy, extraerFechaYMD } from '../utils/date';

interface ReservasViewProps {
  reservas: Reserva[];
  alumnos: Alumno[];
  onOpenNuevaReserva: () => void;
  onEditarReserva: (reserva: Reserva) => void;
  onCancelarReserva: (reserva: Reserva) => void;
  onMarcarPagada: (reservaId: number, alumnoId: number) => void;
  onEliminarReserva: (reservaId: number) => void;
  onVerAlumnoPorId: (alumnoId: number) => void;
}

export const ReservasView: React.FC<ReservasViewProps> = ({
  reservas,
  alumnos,
  onOpenNuevaReserva,
  onEditarReserva,
  onCancelarReserva,
  onMarcarPagada,
  onEliminarReserva,
  onVerAlumnoPorId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterTiempo, setFilterTiempo] = useState<'all' | 'futuras' | 'pasadas'>('all');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredReservas = useMemo(() => {
    return reservas.filter((r) => {
      // Búsqueda
      const term = searchTerm.toLowerCase();
      const matchCodigo = (r.codigo || '').toLowerCase().includes(term);
      const matchAlumno = `${r.alumno_nombre || ''} ${r.alumno_apellido || ''}`.toLowerCase().includes(term);
      const matchCorreo = (r.alumno_correo || '').toLowerCase().includes(term);
      const matchTipo = (r.tipo_clase || '').toLowerCase().includes(term);
      if (searchTerm && !matchCodigo && !matchAlumno && !matchCorreo && !matchTipo) {
        return false;
      }

      // Estado
      if (filterEstado !== 'all' && r.estado !== filterEstado) return false;

      // Tipo
      if (filterTipo !== 'all') {
        if (!r.tipo_clase || !r.tipo_clase.includes(filterTipo)) return false;
      }

      // Temporal
      if (filterTiempo !== 'all') {
        const diff = getDiasDiferenciaHoy(r.fecha_realizado);
        if (filterTiempo === 'futuras' && diff < 0) return false;
        if (filterTiempo === 'pasadas' && diff >= 0) return false;
      }

      // Rango de fechas (Inicio y/o Fin)
      if (fechaInicio || fechaFin) {
        const ymd = extraerFechaYMD(r.fecha_realizado);
        if (!ymd) return false;
        if (fechaInicio && ymd < fechaInicio) return false;
        if (fechaFin && ymd > fechaFin) return false;
      }

      return true;
    });
  }, [reservas, searchTerm, filterEstado, filterTipo, filterTiempo, fechaInicio, fechaFin]);

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">
            Gestión de Todas las Reservas y Clases
          </h2>
          <p className="text-xs text-slate-400">
            Supervisa estados de pago, fechas agendadas, cancelaciones y alumnos.
          </p>
        </div>

        <button
          onClick={onOpenNuevaReserva}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Nueva Reserva</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-3">
        {/* Fila 1: Búsqueda y Filtros de Estado / Modalidad / Tiempo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código, alumno, correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* Filter Estado */}
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pack">Cubiertas por Pack</option>
            <option value="debe">Pendiente de Pago (Debe)</option>
            <option value="pagada">Pagadas</option>
            <option value="cancelada">Canceladas</option>
          </select>

          {/* Filter Tipo */}
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todas las modalidades</option>
            <option value="individual">Individuales</option>
            <option value="grupal">Grupales</option>
            <option value="tp">Trabajo Práctico (TP)</option>
            <option value="consulta">Consulta</option>
            <option value="estandar">Clase Estándar</option>
          </select>

          {/* Filter Temporal */}
          <select
            value={filterTiempo}
            onChange={(e: any) => setFilterTiempo(e.target.value)}
            className="px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todas las fechas (histórico)</option>
            <option value="futuras">Solo próximas / futuras</option>
            <option value="pasadas">Solo pasadas / finalizadas</option>
          </select>
        </div>

        {/* Fila 2: Filtro por Rango de Fecha (Inicio y Fin) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mr-1">
              <CalendarRange className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Rango de fechas:</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-slate-400 text-[11px] font-medium">Inicio:</span>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="bg-transparent text-slate-100 text-xs focus:outline-none [color-scheme:dark] cursor-pointer"
                title="Fecha de inicio"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-slate-400 text-[11px] font-medium">Fin:</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="bg-transparent text-slate-100 text-xs focus:outline-none [color-scheme:dark] cursor-pointer"
                title="Fecha de fin"
              />
            </div>

            {(fechaInicio || fechaFin) && (
              <button
                type="button"
                onClick={() => {
                  setFechaInicio('');
                  setFechaFin('');
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 rounded-lg text-xs transition border border-slate-700"
                title="Limpiar rango de fechas"
              >
                <X className="w-3 h-3 text-slate-400" />
                <span>Limpiar fechas</span>
              </button>
            )}
          </div>

          {(searchTerm || filterEstado !== 'all' || filterTipo !== 'all' || filterTiempo !== 'all' || fechaInicio || fechaFin) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterEstado('all');
                setFilterTipo('all');
                setFilterTiempo('all');
                setFechaInicio('');
                setFechaFin('');
              }}
              className="text-[11px] text-blue-400 hover:text-blue-300 transition underline underline-offset-2 ml-auto"
            >
              Restablecer todos los filtros
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <th className="py-3 px-4">Fecha & Horario</th>
                <th className="py-3 px-4">Alumno</th>
                <th className="py-3 px-4">Modalidad & Horas</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Precio & Mora</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredReservas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No se encontraron reservas con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredReservas.map((r) => {
                  const celdas = Array.isArray(r.celdas) ? r.celdas : [];
                  const esGrupal = r.tipo_clase?.includes('grupal') || (r.integrantes && r.integrantes.length > 1);

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition">
                      {/* Fecha & Horario */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>{formatearFecha(r.fecha_realizado, { conDiaSemana: true, textoVacio: 'Fecha pendiente' })}</span>
                        </div>
                        {r.horaInicio && (
                          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] mt-0.5 ml-5">
                            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{r.horaInicio} hs</span>
                          </div>
                        )}
                      </td>

                      {/* Alumno */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onVerAlumnoPorId(r.alumno_id)}
                          className="font-semibold text-slate-200 hover:text-blue-400 text-left transition"
                        >
                          {r.alumno_nombre} {r.alumno_apellido || ''}
                        </button>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {r.alumno_correo}
                        </div>
                        {esGrupal && r.integrantes && r.integrantes.length > 0 && (
                          <div className="text-[10px] text-indigo-400 flex items-center gap-1 mt-0.5">
                            <Users className="w-3 h-3 shrink-0" />
                            <span>{r.integrantes.length} integrantes</span>
                          </div>
                        )}
                      </td>

                      {/* Modalidad & Horas */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-300">
                          {r.tipo_clase || 'Clase estándar'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {celdas.length} hs ({celdas.join(', ')})
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                            r.estado === 'pack'
                              ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                              : r.estado === 'pagada'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                              : r.estado === 'cancelada'
                              ? 'bg-slate-800 text-slate-400 border-slate-700'
                              : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                          }`}
                        >
                          {r.estado}
                        </span>
                      </td>

                      {/* Precio & Mora */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-100">
                          {formatMoney(Number(r.precio || 0))}
                        </div>
                        {(r.recargoMora || 0) > 0 && (
                          <div className="text-[10px] text-rose-400 font-mono mt-0.5">
                            + {formatMoney(r.recargoMora || 0)} mora
                          </div>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.estado === 'debe' && (
                            <button
                              onClick={() => onMarcarPagada(r.id, r.alumno_id)}
                              className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition"
                              title="Marcar como pagada"
                            >
                              Cobrar
                            </button>
                          )}
                          {r.estado !== 'cancelada' && (
                            <button
                              onClick={() => onCancelarReserva(r)}
                              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition"
                              title="Cancelar reserva"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onEditarReserva(r)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                            title="Editar datos de reserva"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEliminarReserva(r.id)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="py-2.5 px-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>
            Mostrando {filteredReservas.length} de {reservas.length} reservas registradas
          </span>
        </div>
      </div>
    </div>
  );
};
