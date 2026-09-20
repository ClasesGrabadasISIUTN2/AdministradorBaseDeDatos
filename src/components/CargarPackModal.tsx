import React, { useState } from 'react';
import { X, Package, Save, AlertCircle, ArrowLeft } from 'lucide-react';
import { Alumno } from '../types';
import { api } from '../services/api';
import { ConfirmacionModal, DetalleConfirmacion } from './ConfirmacionModal';

interface CargarPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  alumno: Alumno | null;
  onSuccess: () => void;
}

export const CargarPackModal: React.FC<CargarPackModalProps> = ({
  isOpen,
  onClose,
  alumno,
  onSuccess,
}) => {
  const [tipoPack, setTipoPack] = useState<'packExamen' | 'packMateria' | 'personalizado'>('packExamen');
  const [horasCustom, setHorasCustom] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmacion, setShowConfirmacion] = useState(false);

  if (!isOpen || !alumno) return null;

  const getHorasAgregadas = () => {
    if (tipoPack === 'packExamen') return 20;
    if (tipoPack === 'packMateria') return 40;
    return horasCustom || 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (getHorasAgregadas() <= 0) {
      setError('La cantidad de horas debe ser mayor a 0.');
      return;
    }
    setError(null);
    setShowConfirmacion(true);
  };

  const handleConfirmedSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.habilitarPack(alumno.id, tipoPack, horasCustom);
      setShowConfirmacion(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al habilitar el pack');
      setShowConfirmacion(false);
    } finally {
      setLoading(false);
    }
  };

  const packNombreMap = {
    packExamen: 'Pack Examen (20 horas)',
    packMateria: 'Pack Materia Completa (40 horas)',
    personalizado: `Personalizado (${horasCustom} horas)`,
  };

  const detallesConfirmacion: DetalleConfirmacion[] = [
    {
      label: 'Alumno',
      valor: `${alumno.nombre} ${alumno.apellido || ''}`,
      destacado: true,
    },
    {
      label: 'Correo',
      valor: alumno.correo,
      mono: true,
    },
    {
      label: 'Modalidad de Pack',
      valor: packNombreMap[tipoPack],
    },
    {
      label: 'Horas a Acreditar',
      valor: `+${getHorasAgregadas()} horas`,
      destacado: true,
      mono: true,
    },
    {
      label: 'Saldo Actual',
      valor: `${alumno.horas_a_favor || 0} horas`,
    },
    {
      label: 'Nuevo Saldo Final',
      valor: `${(alumno.horas_a_favor || 0) + getHorasAgregadas()} horas`,
      destacado: true,
      mono: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              Habilitar / Cargar Pack de Horas
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition cursor-pointer"
              title="Volver a la sección anterior"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Volver</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-950/50 border border-rose-800/60 rounded-lg text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-400">Alumno:</span>{' '}
                <span className="font-bold text-slate-100">{alumno.nombre} {alumno.apellido || ''}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400">Saldo actual:</span>{' '}
                <span className="font-mono font-bold text-cyan-400">{alumno.horas_a_favor || 0} hs</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{alumno.correo}</div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-2">
              Seleccionar Modalidad de Pack
            </label>

            <div className="grid grid-cols-1 gap-2">
              <label
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                  tipoPack === 'packExamen'
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="packTipo"
                    checked={tipoPack === 'packExamen'}
                    onChange={() => setTipoPack('packExamen')}
                    className="text-cyan-600 focus:ring-0"
                  />
                  <div>
                    <div className="font-semibold">Pack Examen (20 horas)</div>
                    <div className="text-[11px] text-slate-400">Ideal para preparación de parciales o finales</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm text-cyan-300">+20 hs</span>
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                  tipoPack === 'packMateria'
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="packTipo"
                    checked={tipoPack === 'packMateria'}
                    onChange={() => setTipoPack('packMateria')}
                    className="text-cyan-600 focus:ring-0"
                  />
                  <div>
                    <div className="font-semibold">Pack Materia Completa (40 horas)</div>
                    <div className="text-[11px] text-slate-400">Cobertura integral de cuatrimestre</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm text-cyan-300">+40 hs</span>
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                  tipoPack === 'personalizado'
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="packTipo"
                    checked={tipoPack === 'personalizado'}
                    onChange={() => setTipoPack('personalizado')}
                    className="text-cyan-600 focus:ring-0"
                  />
                  <div>
                    <div className="font-semibold">Horas Sueltas / Personalizado</div>
                    <div className="text-[11px] text-slate-400">Cargar cantidad específica de horas</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm text-cyan-300">Variable</span>
              </label>
            </div>
          </div>

          {tipoPack === 'personalizado' && (
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Cantidad de Horas a Acreditar *
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={horasCustom}
                onChange={(e) => setHorasCustom(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          )}

          <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-lg flex items-center justify-between">
            <span className="text-slate-300">Nuevo saldo estimado:</span>
            <span className="font-mono font-bold text-base text-cyan-300">
              {(alumno.horas_a_favor || 0) + getHorasAgregadas()} horas
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
              disabled={loading || getHorasAgregadas() <= 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Habilitando...' : 'Habilitar Pack'}</span>
            </button>
          </div>
        </form>
      </div>

      <ConfirmacionModal
        isOpen={showConfirmacion}
        title="Confirmar Carga de Pack de Horas"
        subtitle="Verifica los datos y la cantidad de horas a acreditar al alumno."
        icon={<Package className="w-5 h-5 text-cyan-400" />}
        detalles={detallesConfirmacion}
        onConfirmar={handleConfirmedSave}
        onCancelar={() => setShowConfirmacion(false)}
        loading={loading}
        textoConfirmar="Confirmar y Habilitar Pack"
        colorBoton="cyan"
      />
    </div>
  );
};
