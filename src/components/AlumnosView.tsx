import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Key,
  Package,
  CreditCard,
  Eye,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { Alumno } from '../types';

interface AlumnosViewProps {
  alumnos: Alumno[];
  onOpenNuevoAlumno: () => void;
  onEditarAlumno: (alumno: Alumno) => void;
  onVerAlumno: (alumno: Alumno) => void;
  onCargarPack: (alumno: Alumno) => void;
  onCobrar: (alumno: Alumno) => void;
  onCambiarClave: (alumno: Alumno) => void;
  onEliminarAlumno: (alumno: Alumno) => void;
}

export const AlumnosView: React.FC<AlumnosViewProps> = ({
  alumnos,
  onOpenNuevoAlumno,
  onEditarAlumno,
  onVerAlumno,
  onCargarPack,
  onCobrar,
  onCambiarClave,
  onEliminarAlumno,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDeuda, setFilterDeuda] = useState<'all' | 'con_deuda' | 'sin_deuda'>('all');
  const [filterPack, setFilterPack] = useState<'all' | 'con_pack' | 'sin_pack'>('all');
  const [selectedMateria, setSelectedMateria] = useState<string>('all');

  const materiasUnicas = useMemo(() => {
    const set = new Set<string>();
    alumnos.forEach((a) => {
      if (a.materia) set.add(a.materia);
    });
    return Array.from(set).sort();
  }, [alumnos]);

  const filteredAlumnos = useMemo(() => {
    return alumnos.filter((a) => {
      // Búsqueda
      const term = searchTerm.toLowerCase();
      const matchName = `${a.nombre} ${a.apellido || ''}`.toLowerCase().includes(term);
      const matchEmail = a.correo.toLowerCase().includes(term);
      const matchPhone = (a.telefono || '').includes(term);
      const matchMateria = (a.materia || '').toLowerCase().includes(term);
      if (searchTerm && !matchName && !matchEmail && !matchPhone && !matchMateria) {
        return false;
      }

      // Filtro de deuda
      if (filterDeuda === 'con_deuda' && (a.deudaTotal || 0) <= 0) return false;
      if (filterDeuda === 'sin_deuda' && (a.deudaTotal || 0) > 0) return false;

      // Filtro de pack
      if (filterPack === 'con_pack' && (a.horas_a_favor || 0) <= 0) return false;
      if (filterPack === 'sin_pack' && (a.horas_a_favor || 0) > 0) return false;

      // Filtro de materia
      if (selectedMateria !== 'all' && a.materia !== selectedMateria) return false;

      return true;
    });
  }, [alumnos, searchTerm, filterDeuda, filterPack, selectedMateria]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">
            Base de Datos de Alumnos / Usuarios
          </h2>
          <p className="text-xs text-slate-400">
            Administración completa de perfiles, contraseñas, materias y estados de cuenta.
          </p>
        </div>

        <button
          onClick={onOpenNuevoAlumno}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Nuevo Alumno</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, materia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filter Deuda */}
        <select
          value={filterDeuda}
          onChange={(e: any) => setFilterDeuda(e.target.value)}
          className="px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="all">Todas las condiciones de deuda</option>
          <option value="con_deuda">Solo con deuda pendiente</option>
          <option value="sin_deuda">Al día (sin deuda)</option>
        </select>

        {/* Filter Pack */}
        <select
          value={filterPack}
          onChange={(e: any) => setFilterPack(e.target.value)}
          className="px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="all">Todos los saldos de Pack</option>
          <option value="con_pack">Con horas de Pack a favor</option>
          <option value="sin_pack">Sin horas de Pack (0 hs)</option>
        </select>

        {/* Filter Materia */}
        <select
          value={selectedMateria}
          onChange={(e) => setSelectedMateria(e.target.value)}
          className="px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="all">Todas las materias ({materiasUnicas.length})</option>
          {materiasUnicas.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Alumnos Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <th className="py-3 px-4">Alumno</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Materia & Estado</th>
                <th className="py-3 px-4">Horas Pack</th>
                <th className="py-3 px-4">Deuda Actual</th>
                <th className="py-3 px-4">Condición</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredAlumnos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No se encontraron alumnos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredAlumnos.map((a) => {
                  const tieneDeuda = (a.deudaTotal || 0) > 0;
                  const tienePack = (a.horas_a_favor || 0) > 0;

                  return (
                    <tr key={a.id} className="hover:bg-slate-800/30 transition">
                      {/* Alumno */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-900/40 border border-blue-700/50 flex items-center justify-center text-blue-300 font-bold shrink-0 text-xs">
                            {a.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <button
                              onClick={() => onVerAlumno(a)}
                              className="font-semibold text-slate-100 hover:text-blue-400 text-left transition"
                            >
                              {a.nombre} {a.apellido || ''}
                            </button>
                            <div className="text-[11px] text-slate-400 font-mono">
                              ID: #{a.id} • Ingreso: {a.anio_ingreso || '-'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{a.correo}</span>
                          </div>
                          {a.telefono ? (
                            <a
                              href={`https://wa.me/${a.telefono.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-mono text-[11px] transition"
                              title="Enviar mensaje por WhatsApp"
                            >
                              <Phone className="w-3 h-3 shrink-0" />
                              <span>{a.telefono}</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400">Sin teléfono</span>
                          )}
                        </div>
                      </td>

                      {/* Materia & Estado */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200 truncate max-w-[180px]">
                          {a.materia || 'No especificada'}
                        </div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          {a.estado_materia || 'Regular'}
                        </span>
                      </td>

                      {/* Horas Pack */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono font-bold text-sm ${
                              tienePack ? 'text-cyan-400' : 'text-slate-400'
                            }`}
                          >
                            {a.horas_a_favor || 0} hs
                          </span>
                          {a.pack ? (
                            <span className="text-[10px] text-slate-400 font-mono">
                              / {a.pack} hs
                            </span>
                          ) : null}
                        </div>
                        {a.fecha_pago && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Desde: {a.fecha_pago}
                          </div>
                        )}
                      </td>

                      {/* Deuda */}
                      <td className="py-3 px-4">
                        {tieneDeuda ? (
                          <div>
                            <div className="font-mono font-bold text-rose-400 text-sm">
                              {formatMoney(a.deudaTotal || 0)}
                            </div>
                            <div className="text-[10px] text-rose-400/80 flex items-center gap-1 mt-0.5">
                              <AlertCircle className="w-3 h-3" />
                              <span>Con mora activa</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-emerald-400 font-medium font-mono">Al día ($0)</span>
                        )}
                      </td>

                      {/* Condición */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                            a.condicion_pago === 'Mora' || tieneDeuda
                              ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                              : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                          }`}
                        >
                          {a.condicion_pago || (tieneDeuda ? 'Mora' : 'Normal')}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onVerAlumno(a)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition"
                            title="Ver ficha completa y reservas"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onCargarPack(a)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition"
                            title="Habilitar horas de Pack"
                          >
                            <Package className="w-3.5 h-3.5" />
                          </button>
                          {tieneDeuda && (
                            <button
                              onClick={() => onCobrar(a)}
                              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition"
                              title="Registrar cobro de deuda"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onCambiarClave(a)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition"
                            title="Modificar contraseña"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditarAlumno(a)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                            title="Editar datos del alumno"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEliminarAlumno(a)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
                            title="Eliminar alumno"
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

        {/* Footer pagination info */}
        <div className="py-2.5 px-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>
            Mostrando {filteredAlumnos.length} de {alumnos.length} alumnos registrados
          </span>
        </div>
      </div>
    </div>
  );
};
