import React from 'react';
import { CheckCircle2, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';

export interface DetalleConfirmacion {
  label: string;
  valor: React.ReactNode;
  destacado?: boolean;
  mono?: boolean;
}

interface ConfirmacionModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  detalles: DetalleConfirmacion[];
  onConfirmar: () => void | Promise<void>;
  onCancelar: () => void;
  loading?: boolean;
  textoConfirmar?: string;
  textoCancelar?: string;
  colorBoton?: 'blue' | 'emerald' | 'cyan' | 'indigo';
}

export const ConfirmacionModal: React.FC<ConfirmacionModalProps> = ({
  isOpen,
  title,
  subtitle = 'Revisa los datos detallados a continuación antes de guardar.',
  icon,
  detalles,
  onConfirmar,
  onCancelar,
  loading = false,
  textoConfirmar = 'Confirmar y Guardar',
  textoCancelar = 'Revisar / Modificar',
  colorBoton = 'blue',
}) => {
  if (!isOpen) return null;

  const getButtonBg = () => {
    switch (colorBoton) {
      case 'emerald':
        return 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20';
      case 'cyan':
        return 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20';
      case 'indigo':
        return 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20';
      case 'blue':
      default:
        return 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20';
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl my-6">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              {icon || <CheckCircle2 className="w-5 h-5 text-blue-400" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base leading-tight">{title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Content / Datos a Crear */}
        <div className="p-5 space-y-4">
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl divide-y divide-slate-750/70 overflow-hidden text-xs">
            {detalles.map((d, index) => (
              <div
                key={index}
                className={`p-2.5 sm:px-3.5 flex items-start justify-between gap-3 ${
                  d.destacado ? 'bg-slate-800/90 font-medium' : ''
                }`}
              >
                <span className="text-slate-400 font-medium shrink-0">{d.label}</span>
                <span
                  className={`text-right ${
                    d.destacado
                      ? 'text-blue-300 font-bold'
                      : d.mono
                      ? 'font-mono text-slate-200'
                      : 'text-slate-200'
                  }`}
                >
                  {d.valor}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300/90">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Al confirmar, los cambios se registrarán inmediatamente en la base de datos.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-slate-800 bg-slate-900/90">
          <button
            type="button"
            onClick={onCancelar}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition disabled:opacity-50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{textoCancelar}</span>
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 text-white text-xs font-semibold rounded-xl shadow-lg transition active:scale-[0.98] disabled:opacity-50 ${getButtonBg()}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{textoConfirmar}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
