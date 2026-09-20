import React, { useState } from 'react';
import { X, Key, Save, AlertCircle, ArrowLeft } from 'lucide-react';
import { Alumno } from '../types';
import { api } from '../services/api';

interface CambiarClaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  alumno: Alumno | null;
  onSuccess: () => void;
}

export const CambiarClaveModal: React.FC<CambiarClaveModalProps> = ({
  isOpen,
  onClose,
  alumno,
  onSuccess,
}) => {
  const [nuevaClave, setNuevaClave] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !alumno) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaClave || nuevaClave.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.cambiarClave(alumno.id, nuevaClave);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              Modificar Contraseña
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition cursor-pointer"
              title="Volver"
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

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-950/50 border border-rose-800/60 rounded-lg text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <span className="text-slate-400">Alumno:</span>{' '}
            <span className="font-semibold text-slate-200">{alumno.nombre} {alumno.apellido || ''}</span>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{alumno.correo}</div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Nueva Contraseña *
            </label>
            <input
              type="text"
              required
              value={nuevaClave}
              onChange={(e) => setNuevaClave(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              placeholder="Escribe la nueva contraseña"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Esta clave reemplazará la contraseña de acceso del alumno en Login.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Actualizando...' : 'Guardar Clave'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
