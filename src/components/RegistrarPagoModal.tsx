import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alumno, Reserva } from '../types';
import { api } from '../services/api';
import { formatearFecha } from '../utils/date';

interface RegistrarPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  alumnos: Alumno[];
  preselectedAlumnoId?: number | null;
  onSuccess: () => void;
}

export const RegistrarPagoModal: React.FC<RegistrarPagoModalProps> = ({
  isOpen,
  onClose,
  alumnos,
  preselectedAlumnoId,
  onSuccess,
}) => {
  const [alumnoId, setAlumnoId] = useState<number>(preselectedAlumnoId || alumnos[0]?.id || 1);
  const [reservasPendientes, setReservasPendientes] = useState<Reserva[]>([]);
  const [selectedReservaIds, setSelectedReservaIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedAlumnoId) {
      setAlumnoId(preselectedAlumnoId);
    } else if (alumnos.length > 0 && !alumnoId) {
      setAlumnoId(alumnos[0].id);
    }
  }, [preselectedAlumnoId, alumnos]);

  useEffect(() => {
    if (isOpen && alumnoId) {
      setFetching(true);
      api.getAlumno(alumnoId)
        .then((res) => {
          const pendientes = (res.reservas || []).filter(
            (r) => (r.estado === 'debe' || r.estado === 'cancelada') && Number(r.precio || 0) > 0
          );
          setReservasPendientes(pendientes);
          setSelectedReservaIds(pendientes.map((p) => p.id));
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          setFetching(false);
        });
    }
    setError(null);
  }, [isOpen, alumnoId]);

  if (!isOpen) return null;

  const toggleReserva = (id: number) => {
    setSelectedReservaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedReservaIds(reservasPendientes.map((r) => r.id));
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalSeleccionado = reservasPendientes
    .filter((r) => selectedReservaIds.includes(r.id))
    .reduce((sum, r) => sum + Number(r.precio || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReservaIds.length === 0) {
      setError('Debes seleccionar al menos una reserva para registrar el pago.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.registrarPago(selectedReservaIds, alumnoId, totalSeleccionado);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              Registrar Pago / Cobro de Clases
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-950/50 border border-rose-800/60 rounded-lg text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Seleccionar Alumno
            </label>
            <select
              value={alumnoId}
              onChange={(e) => setAlumnoId(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {alumnos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} {a.apellido || ''} ({a.correo}) - Deuda: {formatMoney(a.deudaTotal || 0)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-medium text-slate-300">
                Seleccionar Clases / Reservas a Cancelar
              </label>
              {reservasPendientes.length > 0 && (
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-emerald-400 hover:underline text-[11px]"
                >
                  Seleccionar todas
                </button>
              )}
            </div>

            {fetching ? (
              <div className="p-4 text-center text-slate-400 bg-slate-800/50 rounded-lg">
                Cargando clases pendientes...
              </div>
            ) : reservasPendientes.length === 0 ? (
              <div className="p-4 text-center text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 rounded-lg">
                Este alumno no tiene deudas pendientes activas.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-800 rounded-lg p-2 bg-slate-800/40">
                {reservasPendientes.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition ${
                      selectedReservaIds.includes(r.id)
                        ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                        : 'bg-slate-800 border-slate-700/60 text-slate-300 hover:bg-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={selectedReservaIds.includes(r.id)}
                        onChange={() => toggleReserva(r.id)}
                        className="rounded border-slate-600 text-emerald-600 focus:ring-0"
                      />
                      <div>
                        <div className="font-mono font-semibold">#{r.codigo}</div>
                        <div className="text-[11px] text-slate-400">
                          {formatearFecha(r.fecha_realizado, { conDiaSemana: true }) || r.fecha_reservada_texto} • {r.tipo_clase || 'Clase'}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-sm">
                      {formatMoney(Number(r.precio || 0))}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg flex items-center justify-between">
            <span className="text-slate-300">Total a liquidar:</span>
            <span className="font-mono font-bold text-base text-emerald-300">
              {formatMoney(totalSeleccionado)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || selectedReservaIds.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Procesando...' : 'Confirmar Cobro'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
