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
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckSquare,
  Square,
  MinusSquare,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Reserva, Alumno } from '../types';
import { formatearFecha, getDiasDiferenciaHoy, extraerFechaYMD } from '../utils/date';
import { api } from '../services/api';

interface ReservasViewProps {
  reservas: Reserva[];
  alumnos: Alumno[];
  onOpenNuevaReserva: () => void;
  onEditarReserva: (reserva: Reserva) => void;
  onCancelarReserva: (reserva: Reserva) => void;
  onMarcarPagada: (reservaId: number, alumnoId: number) => void;
  onEliminarReserva: (reservaId: number) => void;
  onVerAlumnoPorId: (alumnoId: number) => void;
  onBulkEliminar?: (ids: number[]) => Promise<void>;
  onBulkCancelar?: (ids: number[], porcentaje: number) => Promise<void>;
  onBulkCobrar?: (ids: number[]) => Promise<void>;
  onBulkCambiarEstado?: (ids: number[], estado: string) => Promise<void>;
}

export type ReservaSortColumn =
  | 'fecha'
  | 'alumno'
  | 'modalidad'
  | 'horas'
  | 'estado'
  | 'precio';

export type SortDirection = 'asc' | 'desc';

export const ReservasView: React.FC<ReservasViewProps> = ({
  reservas,
  alumnos,
  onOpenNuevaReserva,
  onEditarReserva,
  onCancelarReserva,
  onMarcarPagada,
  onEliminarReserva,
  onVerAlumnoPorId,
  onBulkEliminar,
  onBulkCancelar,
  onBulkCobrar,
  onBulkCambiarEstado,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterTiempo, setFilterTiempo] = useState<'all' | 'futuras' | 'pasadas'>('all');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [sortBy, setSortBy] = useState<ReservaSortColumn>('fecha');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkCancelModalOpen, setIsBulkCancelModalOpen] = useState(false);
  const [bulkCancelPorcentaje, setBulkCancelPorcentaje] = useState<number>(0);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkCobrarModalOpen, setIsBulkCobrarModalOpen] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const handleSort = (column: ReservaSortColumn) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(column);
      if (column === 'alumno' || column === 'modalidad' || column === 'estado') {
        setSortDirection('asc');
      } else {
        setSortDirection('desc');
      }
    }
  };

  const sortColumnLabels: Record<ReservaSortColumn, string> = {
    fecha: 'Fecha & Horario',
    alumno: 'Alumno',
    modalidad: 'Modalidad',
    horas: 'Duración / Horas',
    estado: 'Estado',
    precio: 'Precio & Mora',
  };

  const getSortLabel = () => {
    if (sortBy === 'fecha') {
      return sortDirection === 'desc' ? 'más reciente primero' : 'más antigua primero';
    }
    if (sortBy === 'alumno' || sortBy === 'modalidad' || sortBy === 'estado') {
      return sortDirection === 'asc' ? 'A → Z' : 'Z → A';
    }
    return sortDirection === 'desc' ? 'mayor a menor' : 'menor a mayor';
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getReservaDateTime = (r: Reserva): number => {
    const ymd = extraerFechaYMD(r.fecha_realizado);
    if (!ymd) return 0;
    const timeStr = r.horaInicio ? (r.horaInicio.length === 5 ? `${r.horaInicio}:00` : r.horaInicio) : '00:00:00';
    const iso = `${ymd}T${timeStr}`;
    const t = new Date(iso).getTime();
    if (!isNaN(t)) return t;
    const tYmd = new Date(ymd).getTime();
    return isNaN(tYmd) ? 0 : tYmd;
  };

  const filteredReservas = useMemo(() => {
    const list = reservas.filter((r) => {
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

    // Ordenamiento por columna y dirección elegida
    return [...list].sort((a, b) => {
      if (sortBy === 'fecha') {
        const tA = getReservaDateTime(a);
        const tB = getReservaDateTime(b);
        if (tA !== tB) {
          return sortDirection === 'desc' ? tB - tA : tA - tB;
        }
        return b.id - a.id;
      }

      if (sortBy === 'alumno') {
        const nameA = `${a.alumno_nombre || ''} ${a.alumno_apellido || ''}`.trim();
        const nameB = `${b.alumno_nombre || ''} ${b.alumno_apellido || ''}`.trim();
        const comp = nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
        if (comp !== 0) {
          return sortDirection === 'desc' ? -comp : comp;
        }
        const emailA = (a.alumno_correo || '').trim().toLowerCase();
        const emailB = (b.alumno_correo || '').trim().toLowerCase();
        const emailComp = emailA.localeCompare(emailB, 'es', { sensitivity: 'base' });
        if (emailComp !== 0) {
          return sortDirection === 'desc' ? -emailComp : emailComp;
        }
        return b.id - a.id;
      }

      if (sortBy === 'modalidad') {
        const modA = (a.tipo_clase || 'Clase estándar').trim();
        const modB = (b.tipo_clase || 'Clase estándar').trim();
        const comp = modA.localeCompare(modB, 'es', { sensitivity: 'base' });
        if (comp !== 0) {
          return sortDirection === 'desc' ? -comp : comp;
        }
        return b.id - a.id;
      }

      if (sortBy === 'horas') {
        const celdasA = Array.isArray(a.celdas) ? a.celdas.length : (a.horas || 0);
        const celdasB = Array.isArray(b.celdas) ? b.celdas.length : (b.horas || 0);
        const diff = celdasA - celdasB;
        if (diff !== 0) {
          return sortDirection === 'desc' ? -diff : diff;
        }
        return b.id - a.id;
      }

      if (sortBy === 'estado') {
        const estA = (a.estado || '').trim().toLowerCase();
        const estB = (b.estado || '').trim().toLowerCase();
        const comp = estA.localeCompare(estB, 'es', { sensitivity: 'base' });
        if (comp !== 0) {
          return sortDirection === 'desc' ? -comp : comp;
        }
        return b.id - a.id;
      }

      if (sortBy === 'precio') {
        const totalA = Number(a.precio || 0) + Number(a.recargoMora || 0);
        const totalB = Number(b.precio || 0) + Number(b.recargoMora || 0);
        const diff = totalA - totalB;
        if (diff !== 0) {
          return sortDirection === 'desc' ? -diff : diff;
        }
        return b.id - a.id;
      }

      return 0;
    });
  }, [reservas, searchTerm, filterEstado, filterTipo, filterTiempo, fechaInicio, fechaFin, sortBy, sortDirection]);

  const renderSortHeader = (label: string, column: ReservaSortColumn) => {
    const isActive = sortBy === column;
    return (
      <th
        onClick={() => handleSort(column)}
        className="py-3 px-4 cursor-pointer hover:text-slate-200 transition select-none group"
        title={`Ordenar por ${label} (${
          isActive
            ? sortDirection === 'desc'
              ? 'actual: mayor a menor / clic para menor a mayor'
              : 'actual: menor a mayor / clic para mayor a menor'
            : 'clic para ordenar'
        })`}
      >
        <div className="flex items-center gap-1.5">
          <span className={isActive ? 'text-blue-400 font-bold' : ''}>
            {label}
          </span>
          {isActive ? (
            sortDirection === 'desc' ? (
              <ArrowDown className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            ) : (
              <ArrowUp className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            )
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 opacity-40 group-hover:opacity-100 shrink-0 transition" />
          )}
        </div>
      </th>
    );
  };

  const renderSortHeaderModalidadHoras = () => {
    const isModalidadActive = sortBy === 'modalidad';
    const isHorasActive = sortBy === 'horas';
    return (
      <th className="py-3 px-4 select-none">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSort('modalidad')}
            className="flex items-center gap-1 cursor-pointer hover:text-slate-200 transition group focus:outline-none"
            title={`Ordenar por Modalidad (${
              isModalidadActive
                ? sortDirection === 'desc'
                  ? 'actual: Z → A / clic para A → Z'
                  : 'actual: A → Z / clic para Z → A'
                : 'clic para ordenar por modalidad'
            })`}
          >
            <span className={isModalidadActive ? 'text-blue-400 font-bold' : ''}>
              Modalidad
            </span>
            {isModalidadActive ? (
              sortDirection === 'desc' ? (
                <ArrowDown className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              ) : (
                <ArrowUp className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              )
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 opacity-40 group-hover:opacity-100 shrink-0 transition" />
            )}
          </button>

          <span className="text-slate-600 font-normal">/</span>

          <button
            type="button"
            onClick={() => handleSort('horas')}
            className="flex items-center gap-1 cursor-pointer hover:text-slate-200 transition group focus:outline-none"
            title={`Ordenar por Duración en Horas (${
              isHorasActive
                ? sortDirection === 'desc'
                  ? 'actual: mayor a menor / clic para menor a mayor'
                  : 'actual: menor a mayor / clic para mayor a menor'
                : 'clic para ordenar por horas'
            })`}
          >
            <span className={isHorasActive ? 'text-blue-400 font-bold' : ''}>
              Horas
            </span>
            {isHorasActive ? (
              sortDirection === 'desc' ? (
                <ArrowDown className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              ) : (
                <ArrowUp className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              )
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 opacity-40 group-hover:opacity-100 shrink-0 transition" />
            )}
          </button>
        </div>
      </th>
    );
  };

  // Selection helpers
  const selectedInFiltered = useMemo(() => {
    return filteredReservas.filter((r) => selectedIds.has(r.id));
  }, [filteredReservas, selectedIds]);

  const allFilteredSelected =
    filteredReservas.length > 0 && selectedInFiltered.length === filteredReservas.length;
  const someFilteredSelected =
    selectedInFiltered.length > 0 && selectedInFiltered.length < filteredReservas.length;

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredReservas.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredReservas.forEach((r) => next.add(r.id));
        return next;
      });
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const selectedReservas = useMemo(() => {
    return reservas.filter((r) => selectedIds.has(r.id));
  }, [reservas, selectedIds]);

  const selectedTotalBase = useMemo(() => {
    return selectedReservas.reduce((acc, r) => acc + Number(r.precio || 0), 0);
  }, [selectedReservas]);

  const selectedTotalConMora = useMemo(() => {
    return selectedReservas.reduce((acc, r) => acc + Number(r.totalConMora || r.precio || 0), 0);
  }, [selectedReservas]);

  const selectedTotalHoras = useMemo(() => {
    return selectedReservas.reduce((acc, r) => {
      const celdas = Array.isArray(r.celdas) ? r.celdas : [];
      return acc + (celdas.length || Number(r.horas || 1));
    }, 0);
  }, [selectedReservas]);

  // Bulk Actions
  const executeBulkCobrar = async () => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);
    const ids = Array.from(selectedIds);
    try {
      if (onBulkCobrar) {
        await onBulkCobrar(ids);
      } else {
        await api.registrarPago(ids);
      }
      clearSelection();
      setIsBulkCobrarModalOpen(false);
    } catch (err: any) {
      alert('Error al registrar cobro de las reservas: ' + err.message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const executeBulkCancelar = async () => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);
    const ids = Array.from(selectedIds);
    try {
      if (onBulkCancelar) {
        await onBulkCancelar(ids, bulkCancelPorcentaje);
      } else {
        await api.bulkCancelarReservas(ids, bulkCancelPorcentaje);
      }
      clearSelection();
      setIsBulkCancelModalOpen(false);
    } catch (err: any) {
      alert('Error al cancelar reservas seleccionadas: ' + err.message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const executeBulkEliminar = async () => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);
    const ids = Array.from(selectedIds);
    try {
      if (onBulkEliminar) {
        await onBulkEliminar(ids);
      } else {
        await api.bulkEliminarReservas(ids);
      }
      clearSelection();
      setIsBulkDeleteModalOpen(false);
    } catch (err: any) {
      alert('Error al eliminar reservas seleccionadas: ' + err.message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const executeBulkCambiarEstado = async (nuevoEstado: string) => {
    if (selectedIds.size === 0 || !nuevoEstado) return;
    setBulkActionLoading(true);
    const ids = Array.from(selectedIds);
    try {
      if (onBulkCambiarEstado) {
        await onBulkCambiarEstado(ids, nuevoEstado);
      } else {
        await api.bulkCambiarEstadoReservas(ids, nuevoEstado);
      }
      clearSelection();
    } catch (err: any) {
      alert('Error al cambiar estado de reservas: ' + err.message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100 tracking-tight">
              Gestión de Todas las Reservas y Clases
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60">
              {filteredReservas.length} {filteredReservas.length === 1 ? 'reserva' : 'reservas'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>Orden actual:</span>
            <span className="text-blue-400 font-medium">
              {sortColumnLabels[sortBy]} ({getSortLabel()})
            </span>
            <span className="text-slate-500">• Clic en cualquier columna para alternar</span>
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
        {/* Fila 1: Búsqueda, Ordenamiento y Filtros de Estado / Modalidad / Tiempo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
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

          {/* Selector de Ordenamiento */}
          <select
            value={`${sortBy}_${sortDirection}`}
            onChange={(e) => {
              const [by, dir] = e.target.value.split('_') as [ReservaSortColumn, SortDirection];
              setSortBy(by);
              setSortDirection(dir);
            }}
            className="px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
            title="Criterio de ordenamiento"
          >
            <option value="fecha_desc">📅 Fecha: Más reciente primero</option>
            <option value="fecha_asc">📅 Fecha: Más antigua primero</option>
            <option value="alumno_asc">👤 Alumno: A → Z (Ascendente)</option>
            <option value="alumno_desc">👤 Alumno: Z → A (Descendente)</option>
            <option value="modalidad_asc">🏷️ Modalidad: A → Z</option>
            <option value="modalidad_desc">🏷️ Modalidad: Z → A</option>
            <option value="horas_desc">⏱️ Duración / Horas: Mayor a menor</option>
            <option value="horas_asc">⏱️ Duración / Horas: Menor a mayor</option>
            <option value="estado_asc">📌 Estado: A → Z</option>
            <option value="estado_desc">📌 Estado: Z → A</option>
            <option value="precio_desc">💰 Precio & Mora: Mayor a menor</option>
            <option value="precio_asc">💰 Precio & Mora: Menor a mayor</option>
          </select>

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

      {/* Barra de Acciones Masivas (cuando hay reservas seleccionadas) */}
      {selectedIds.size > 0 && (
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-2 border-blue-500/70 p-3.5 rounded-xl shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {selectedIds.size} {selectedIds.size === 1 ? 'reserva seleccionada' : 'reservas seleccionadas'}
              </span>
            </div>
            <div className="text-xs text-slate-300 flex items-center gap-2 flex-wrap">
              <span>Importe total: <strong className="text-emerald-400 font-mono font-bold">{formatMoney(selectedTotalConMora)}</strong></span>
              <span className="text-slate-600">•</span>
              <span>Horas: <strong className="text-slate-200 font-bold">{selectedTotalHoras} hs</strong></span>
            </div>
          </div>

          {/* Botones de Acción Masiva */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Cobrar / Marcar como Pagadas */}
            <button
              type="button"
              onClick={() => setIsBulkCobrarModalOpen(true)}
              disabled={bulkActionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50 cursor-pointer"
              title="Marcar como pagadas las reservas seleccionadas"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Cobrar / Pagadas ({selectedIds.size})</span>
            </button>

            {/* Cancelar Masivo */}
            <button
              type="button"
              onClick={() => {
                setBulkCancelPorcentaje(0);
                setIsBulkCancelModalOpen(true);
              }}
              disabled={bulkActionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50 cursor-pointer"
              title="Cancelar las reservas seleccionadas con opción de cobro"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancelar ({selectedIds.size})</span>
            </button>

            {/* Selector para Cambiar Estado */}
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  executeBulkCambiarEstado(e.target.value);
                  e.target.value = '';
                }
              }}
              disabled={bulkActionLoading}
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer focus:outline-none focus:border-blue-500"
              title="Cambiar estado en lote"
            >
              <option value="" disabled>Cambiar estado...</option>
              <option value="debe">Marcar como "Debe"</option>
              <option value="pack">Marcar como "Cubierta por Pack"</option>
              <option value="pagada">Marcar como "Pagada"</option>
              <option value="cancelada">Marcar como "Cancelada"</option>
            </select>

            {/* Eliminar Masivo */}
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              disabled={bulkActionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50 cursor-pointer"
              title="Eliminar las reservas seleccionadas de la base de datos"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar ({selectedIds.size})</span>
            </button>

            {/* Deseleccionar todo */}
            <button
              type="button"
              onClick={clearSelection}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition border border-slate-700 cursor-pointer"
              title="Deseleccionar todas"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
              <span>Deseleccionar</span>
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <th className="py-3 px-3 w-10 text-center select-none">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someFilteredSelected;
                      }}
                      onChange={toggleSelectAll}
                      className="table-checkbox"
                      title={allFilteredSelected ? 'Deseleccionar todas' : 'Seleccionar todas las visibles'}
                    />
                  </div>
                </th>
                {renderSortHeader('Fecha & Horario', 'fecha')}
                {renderSortHeader('Alumno', 'alumno')}
                {renderSortHeaderModalidadHoras()}
                {renderSortHeader('Estado', 'estado')}
                {renderSortHeader('Precio & Mora', 'precio')}
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredReservas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No se encontraron reservas con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredReservas.map((r) => {
                  const celdas = Array.isArray(r.celdas) ? r.celdas : [];
                  const esGrupal = r.tipo_clase?.includes('grupal') || (r.integrantes && r.integrantes.length > 1);
                  const isSelected = selectedIds.has(r.id);

                  return (
                    <tr
                      key={r.id}
                      className={`transition ${
                        isSelected
                          ? 'bg-blue-950/40 hover:bg-blue-950/50 border-l-4 border-l-blue-500'
                          : 'hover:bg-slate-800/30'
                      }`}
                    >
                      {/* Checkbox de selección */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(r.id)}
                            className="table-checkbox"
                            title="Seleccionar reserva"
                          />
                        </div>
                      </td>

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
                              className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition cursor-pointer"
                              title="Marcar como pagada"
                            >
                              Cobrar
                            </button>
                          )}
                          {r.estado !== 'cancelada' && (
                            <button
                              onClick={() => onCancelarReserva(r)}
                              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition cursor-pointer"
                              title="Cancelar reserva"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onEditarReserva(r)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                            title="Editar datos de reserva"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEliminarReserva(r.id)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition cursor-pointer"
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
          {selectedIds.size > 0 && (
            <span className="text-blue-400 font-medium">
              {selectedIds.size} seleccionada(s)
            </span>
          )}
        </div>
      </div>

      {/* Modal de Cancelación Masiva */}
      {isBulkCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/40">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  Cancelar {selectedIds.size} Reservas Seleccionadas
                </h3>
              </div>
              <button
                onClick={() => !bulkActionLoading && setIsBulkCancelModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-200">
                Esta acción cancelará <strong>{selectedIds.size} reservas</strong>. Selecciona la política de cobro que deseas aplicar a todas ellas:
              </div>

              {/* Opciones de Porcentaje */}
              <div className="space-y-2">
                {[
                  {
                    pct: 0,
                    label: '0% - Bonificada (Sin costo)',
                    desc: 'No se cobrará cargo por cancelación.',
                    total: 0,
                  },
                  {
                    pct: 25,
                    label: '25% - Penalización estándar',
                    desc: 'Se cobrará el 25% del valor base.',
                    total: Math.round(selectedTotalBase * 0.25),
                  },
                  {
                    pct: 100,
                    label: '100% - Cobro completo',
                    desc: 'Se mantendrá el cobro del 100% como si se hubiese dictado.',
                    total: selectedTotalBase,
                  },
                ].map((opt) => (
                  <button
                    key={opt.pct}
                    type="button"
                    onClick={() => setBulkCancelPorcentaje(opt.pct)}
                    className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition cursor-pointer ${
                      bulkCancelPorcentaje === opt.pct
                        ? 'bg-blue-600/20 border-blue-500 text-slate-100 shadow-xs'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-100">{opt.label}</div>
                      <div className="text-[11px] text-slate-400">{opt.desc}</div>
                    </div>
                    <div className="text-right pl-3">
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        {formatMoney(opt.total)}
                      </div>
                      <div className="text-[10px] text-slate-500">acumulado</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBulkCancelModalOpen(false)}
                  disabled={bulkActionLoading}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={executeBulkCancelar}
                  disabled={bulkActionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50 cursor-pointer"
                >
                  {bulkActionLoading ? (
                    <span>Procesando...</span>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Confirmar Cancelación de {selectedIds.size} Reservas</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cobro Masivo */}
      {isBulkCobrarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/40">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  Cobrar {selectedIds.size} Reservas Seleccionadas
                </h3>
              </div>
              <button
                onClick={() => !bulkActionLoading && setIsBulkCobrarModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-200">
                Se registrará el pago y se marcarán como <strong>"Pagadas"</strong> todas las <strong>{selectedIds.size} reservas seleccionadas</strong>.
              </div>

              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Cantidad de reservas:</span>
                  <span className="font-bold text-slate-200">{selectedIds.size}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Horas totales:</span>
                  <span className="font-bold text-slate-200">{selectedTotalHoras} hs</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-700">
                  <span className="font-semibold">Importe total a liquidar:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {formatMoney(selectedTotalConMora)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBulkCobrarModalOpen(false)}
                  disabled={bulkActionLoading}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executeBulkCobrar}
                  disabled={bulkActionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50 cursor-pointer"
                >
                  {bulkActionLoading ? (
                    <span>Procesando...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Pago de {formatMoney(selectedTotalConMora)}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Eliminación Masiva */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/40">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  ¿Eliminar {selectedIds.size} Reservas Seleccionadas?
                </h3>
              </div>
              <button
                onClick={() => !bulkActionLoading && setIsBulkDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong>¡Atención!</strong> Esta acción eliminará permanentemente <strong>{selectedIds.size} reservas</strong> de la base de datos. Esta operación no se puede revertir.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  disabled={bulkActionLoading}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executeBulkEliminar}
                  disabled={bulkActionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50 cursor-pointer"
                >
                  {bulkActionLoading ? (
                    <span>Eliminando...</span>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Sí, Eliminar {selectedIds.size} Reservas</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
