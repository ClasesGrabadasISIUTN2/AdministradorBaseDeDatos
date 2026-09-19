import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  BookOpen,
  Package,
  CreditCard,
  Key,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Alumno, Reserva } from '../types';
import { api } from '../services/api';
import { formatearFecha, formatearUltimaConexion } from '../utils/date';

interface AlumnoFichaModalProps {
  isOpen: boolean;
  onClose: () => void;
  alumno: Alumno | null;
  onEditar: (alumno: Alumno) => void;
  onCargarPack: (alumno: Alumno) => void;
  onCobrar: (alumno: Alumno) => void;
  onCambiarClave: (alumno: Alumno) => void;
  onReservasChange: () => void;
}

export const AlumnoFichaModal: React.FC<AlumnoFichaModalProps> = ({
  isOpen,
  onClose,
  alumno,
  onEditar,
  onCargarPack,
  onCobrar,
  onCambiarClave,
  onReservasChange,
}) => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (alumno && isOpen) {
      setLoading(true);
      api.getAlumno(alumno.id)
        .then((res) => {
          setReservas(res.reservas || []);
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [alumno, isOpen]);

  if (!isOpen || !alumno) return null;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleMarcarPagada = async (reservaId: number) => {
    try {
      await api.registrarPago([reservaId], alumno.id);
      const updated = await api.getAlumno(alumno.id);
      setReservas(updated.reservas || []);
      onReservasChange();
    } catch (err) {
      alert('Error al marcar reserva como pagada');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 font-bold text-base">
              {alumno.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-lg">
                  {alumno.nombre} {alumno.apellido || ''}
                </h3>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    (alumno.deudaTotal || 0) > 0
                      ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                  }`}
                >
                  {alumno.condicion_pago || ((alumno.deudaTotal || 0) > 0 ? 'Mora' : 'Normal')}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ID Alumno: #{alumno.id} • Registrado el {new Date(alumno.created_at).toLocaleDateString('es-AR')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Top Quick Action Bar */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl">
            <button
              onClick={() => onCargarPack(alumno)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-medium transition"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Cargar / Ajustar Pack</span>
            </button>
            {(alumno.deudaTotal || 0) > 0 && (
              <button
                onClick={() => onCobrar(alumno)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-medium transition"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Registrar Pago / Cobro</span>
              </button>
            )}
            <button
              onClick={() => onCambiarClave(alumno)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-medium transition"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Cambiar Contraseña</span>
            </button>
            <button
              onClick={() => onEditar(alumno)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition ml-auto"
            >
              <span>Editar Datos</span>
            </button>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3">
              <div className="text-slate-400 font-medium text-[11px] mb-1 flex items-center justify-between">
                <span>Horas de Pack a Favor</span>
                <Package className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xl font-bold font-mono text-cyan-300">
                {alumno.horas_a_favor || 0} hs
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Pack total: {alumno.pack || 0} hs • Fecha pago: {formatearFecha(alumno.fecha_pago) || '-'}
              </div>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3">
              <div className="text-slate-400 font-medium text-[11px] mb-1 flex items-center justify-between">
                <span>Deuda Total Calculada</span>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-xl font-bold font-mono text-rose-400">
                {formatMoney(alumno.deudaTotal || 0)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Incluye mora y recargos por cancelación
              </div>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3">
              <div className="text-slate-400 font-medium text-[11px] mb-1 flex items-center justify-between">
                <span>Total de Reservas</span>
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-100">
                {reservas.length}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                En historial académico
              </div>
            </div>
          </div>

          {/* Student Info Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/30 border border-slate-800 rounded-xl p-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-300 text-xs uppercase tracking-wider">
                Datos Personales y Contacto
              </h4>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{alumno.correo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {alumno.telefono ? (
                    <a
                      href={`https://wa.me/${alumno.telefono.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      <span>{alumno.telefono}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-500">Sin teléfono</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500">Año de Ingreso UTN:</span>{' '}
                  <span className="font-semibold text-slate-200">{alumno.anio_ingreso || 'No registrado'}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-700/40 mt-1">
                  <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <div>
                    <span className="text-slate-500">Última Conexión:</span>{' '}
                    <span className="font-medium text-slate-200">
                      {formatearUltimaConexion(alumno.ultima_conexion).relativo}
                    </span>
                    {alumno.ultima_conexion && (
                      <span className="text-[10px] text-slate-400 font-mono ml-1.5">
                        ({formatearUltimaConexion(alumno.ultima_conexion).texto})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-slate-300 text-xs uppercase tracking-wider">
                Información Académica
              </h4>
              <div className="space-y-1.5 text-slate-300">
                <div>
                  <span className="text-slate-500">Materia Principal:</span>{' '}
                  <span className="font-semibold text-slate-200">{alumno.materia || 'No asignada'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Condición Académica:</span>{' '}
                  <span className="font-semibold text-slate-200">{alumno.estado_materia || 'Regular'}</span>
                </div>
                {alumno.comentario && (
                  <div>
                    <span className="text-slate-500">Comentario:</span>{' '}
                    <span className="text-slate-300 italic">{alumno.comentario}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Historial de Reservas del Alumno */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Historial de Reservas y Clases</span>
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                {reservas.length} registros
              </span>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900">
              {loading ? (
                <div className="p-8 text-center text-slate-400">Cargando reservas...</div>
              ) : reservas.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  Este alumno aún no tiene reservas registradas.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-800/40 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Modalidad</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3">Precio</th>
                      <th className="py-2.5 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {reservas.map((r) => {
                      const celdas = Array.isArray(r.celdas) ? r.celdas : [];
                      return (
                        <tr key={r.id} className="hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">
                            {r.codigo}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-slate-200">{formatearFecha(r.fecha_realizado, { conDiaSemana: true })}</div>
                            <div className="text-[10px] text-slate-400">{r.fecha_reservada_texto}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {r.tipo_clase || 'Individual'} ({celdas.length} hs)
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
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
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-200">
                            {formatMoney(Number(r.precio || 0))}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {r.estado === 'debe' && (
                              <button
                                onClick={() => handleMarcarPagada(r.id)}
                                className="px-2 py-0.5 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold transition"
                              >
                                Cobrar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-800/40 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
