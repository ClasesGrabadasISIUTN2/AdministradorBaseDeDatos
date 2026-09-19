import React, { useState, useMemo } from 'react';
import {
  Search,
  PlusCircle,
  Calendar,
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
} from 'lucide-react';
import { Reserva, Alumno } from '../types';

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

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredReservas = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

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
        const fecha = r.fecha_realizado ? new Date(r.fecha_realizado) : null;
        if (fecha) {
          fecha.setHours(0, 0, 0, 0);
          if (filterTiempo === 'futuras' && fecha < hoy) return false;
          if (filterTiempo === 'pasadas' && fecha >= hoy) return false;
        }
      }

      return true;
    });
  }, [reservas, searchTerm, filterEstado, filterTipo, filterTiempo]);

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">
            Gestión de Todas las Reservas y Clases
          </h2>
          <p className="text-xs text-slate-400">
            Supervisa estados de pago, cancelaciones, códigos de reserva y miembros grupales.
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-slate-900 border border-slate-800 p-3 rounded-xl">
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

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <th className="py-3 px-4">Código & Fecha</th>
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
                      {/* Código & Fecha */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-200 text-xs">
                          {r.codigo}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-300 font-medium mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{r.fecha_realizado || 'Fecha pendiente'}</span>
                          {r.horaInicio && (
                            <>
                              <Clock className="w-3 h-3 text-slate-400 ml-1 shrink-0" />
                              <span className="text-slate-300">{r.horaInicio} hs</span>
                            </>
                          )}
                        </div>
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
