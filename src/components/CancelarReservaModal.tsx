import React, { useState } from 'react';
import { X, AlertTriangle, XCircle } from 'lucide-react';
import { Reserva } from '../types';
import { api } from '../services/api';

interface CancelarReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  reserva: Reserva | null;
  onSuccess: () => void;
}

export const CancelarReservaModal: React.FC<CancelarReservaModalProps> = ({
  isOpen,
  onClose,
  reserva,
  onSuccess,
}) => {
  const [porcentaje, setPorcentaje] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !reserva) return null;

  const precioBase = Number(reserva.precio || 0);
  const nuevoPrecio = Math.round((precioBase * porcentaje) / 100);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleConfirmar = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.cancelarReserva(reserva.id, porcentaje);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al cancelar la reserva');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              Cancelar Reserva #{reserva.codigo}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-950/50 border border-rose-800/60 rounded-lg text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Alumno:</span>
              <span className="font-semibold text-slate-200">{reserva.alumno_nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fecha Clase:</span>
              <span className="font-medium text-slate-200">{reserva.fecha_realizado}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Precio original:</span>
              <span className="font-mono font-semibold text-slate-200">{formatMoney(precioBase)}</span>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-2">
              Seleccionar Política de Cobro de Cancelación (Reglas de Negocio)
            </label>

            <div className="space-y-2">
              <label
                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition ${
                  porcentaje === 0
                    ? 'bg-blue-950/40 border-blue-500/60 text-blue-200'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="porcentaje"
                    checked={porcentaje === 0}
                    onChange={() => setPorcentaje(0)}
                    className="text-blue-600 focus:ring-0"
                  />
                  <div>
                    <div className="font-semibold">0% - Sin Costo (Gratis)</div>
                    <div className="text-[10px] text-slate-400">Excepción administrativa o anticipada (+2 días)</div>
                  </div>
                </div>
                <span className="font-mono font-bold">$0</span>
              </label>

              <label
                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition ${
                  porcentaje === 25
                    ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="porcentaje"
                    checked={porcentaje === 25}
                    onChange={() => setPorcentaje(25)}
                    className="text-amber-600 focus:ring-0"
                  />
                  <div>
                    <div className="font-semibold">25% - Cancelación Día Anterior</div>
                    <div className="text-[10px] text-slate-400">Tarifa reducida por aviso con 24h</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-amber-300">{formatMoney(precioBase * 0.25)}</span>
              </label>

              <label
                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition ${
                  porcentaje === 100
                    ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="porcentaje"
                    checked={porcentaje === 100}
                    onChange={() => setPorcentaje(100)}
                    className="text-rose-600 focus:ring-0"
                  />
                  <div>
                    <div className="font-semibold">100% - Cancelación Mismo Día</div>
                    <div className="text-[10px] text-slate-400">Cobro completo por no presentación o cancelación tardía</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-rose-300">{formatMoney(precioBase)}</span>
              </label>
            </div>
          </div>

          <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-lg flex items-center justify-between">
            <span className="text-slate-300">Monto final que quedará registrado:</span>
            <span className="font-mono font-bold text-base text-slate-100">{formatMoney(nuevoPrecio)}</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleConfirmar}
              disabled={loading}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg shadow transition disabled:opacity-50"
            >
              {loading ? 'Cancelando...' : 'Confirmar Cancelación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
