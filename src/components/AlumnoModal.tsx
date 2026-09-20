import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, BookOpen, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { Alumno } from '../types';
import { formatearFechaHora } from '../utils/date';
import { ConfirmacionModal, DetalleConfirmacion } from './ConfirmacionModal';

interface AlumnoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Alumno>) => Promise<void>;
  alumno?: Alumno | null;
}

export const AlumnoModal: React.FC<AlumnoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  alumno,
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    anio_ingreso: 2024,
    materia: '',
    estado_materia: 'Cursando',
    comentario: '',
    horas_a_favor: 0,
    pack: 0,
    condicion_pago: 'Normal' as 'Normal' | 'Libre' | 'Deudor',
    password_hash: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmacion, setShowConfirmacion] = useState(false);

  const normalizarCondicion = (cond?: string | null): 'Normal' | 'Libre' | 'Deudor' => {
    if (!cond) return 'Normal';
    if (cond === 'Mora') return 'Deudor';
    if (cond === 'Libre') return 'Libre';
    if (cond === 'Deudor') return 'Deudor';
    return 'Normal';
  };

  useEffect(() => {
    if (alumno) {
      setFormData({
        nombre: alumno.nombre || '',
        apellido: alumno.apellido || '',
        correo: alumno.correo || '',
        telefono: alumno.telefono || '',
        anio_ingreso: alumno.anio_ingreso || 2024,
        materia: alumno.materia || '',
        estado_materia: alumno.estado_materia || 'Cursando',
        comentario: alumno.comentario || '',
        horas_a_favor: alumno.horas_a_favor || 0,
        pack: alumno.pack || 0,
        condicion_pago: normalizarCondicion(alumno.condicion_pago),
        password_hash: alumno.password_hash || '',
      });
    } else {
      setFormData({
        nombre: '',
        apellido: '',
        correo: '',
        telefono: '+549342',
        anio_ingreso: 2024,
        materia: 'Análisis Matemático I',
        estado_materia: 'Cursando',
        comentario: '',
        horas_a_favor: 0,
        pack: 0,
        condicion_pago: 'Normal',
        password_hash: 'utn1234',
      });
    }
    setError(null);
    setShowConfirmacion(false);
  }, [alumno, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.correo.trim()) {
      setError('Nombre y correo electrónico son obligatorios.');
      return;
    }
    setError(null);
    setShowConfirmacion(true);
  };

  const handleConfirmedSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSave(formData);
      setShowConfirmacion(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar los datos');
      setShowConfirmacion(false);
    } finally {
      setLoading(false);
    }
  };

  const detallesConfirmacion: DetalleConfirmacion[] = [
    {
      label: 'Nombre Completo',
      valor: `${formData.nombre} ${formData.apellido || ''}`.trim(),
      destacado: true,
    },
    {
      label: 'Correo Electrónico',
      valor: formData.correo,
      mono: true,
    },
    {
      label: 'Teléfono / WhatsApp',
      valor: formData.telefono || 'No especificado',
      mono: true,
    },
    {
      label: 'Materia Principal',
      valor: formData.materia || 'No especificada',
    },
    {
      label: 'Estado Académico',
      valor: formData.estado_materia,
    },
    {
      label: 'Horas a Favor / Pack',
      valor: `${formData.horas_a_favor || 0} horas`,
      destacado: (formData.horas_a_favor || 0) > 0,
    },
    {
      label: 'Condición',
      valor: formData.condicion_pago,
    },
    ...(alumno
      ? []
      : [
          {
            label: 'Contraseña de Acceso',
            valor: formData.password_hash || 'utn1234',
            mono: true,
          },
        ]),
    ...(formData.comentario
      ? [
          {
            label: 'Observaciones',
            valor: formData.comentario,
          },
        ]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-slate-100 text-base">
              {alumno ? 'Editar Datos del Alumno' : 'Registrar Nuevo Alumno'}
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-lg text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                placeholder="Ej. Lucas"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Apellido
              </label>
              <input
                type="text"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                placeholder="Ej. Fernández"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                required
                value={formData.correo}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                placeholder="alumno@ejemplo.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Teléfono (WhatsApp)
              </label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                placeholder="+549342..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Materia Principal
              </label>
              <input
                type="text"
                value={formData.materia}
                onChange={(e) => setFormData({ ...formData, materia: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                placeholder="Ej. Análisis Matemático I"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Estado de la Materia
              </label>
              <select
                value={formData.estado_materia}
                onChange={(e) => setFormData({ ...formData, estado_materia: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Cursando">Cursando</option>
                <option value="Regular">Regular</option>
                <option value="Recursando">Recursando</option>
                <option value="Libre">Libre</option>
                <option value="Preparando Final">Preparando Final</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Año Ingreso
              </label>
              <input
                type="number"
                value={formData.anio_ingreso}
                onChange={(e) => setFormData({ ...formData, anio_ingreso: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Horas a Favor
              </label>
              <input
                type="number"
                value={formData.horas_a_favor}
                onChange={(e) => setFormData({ ...formData, horas_a_favor: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Condición
              </label>
              <select
                value={formData.condicion_pago}
                onChange={(e) => setFormData({ ...formData, condicion_pago: e.target.value as 'Normal' | 'Libre' | 'Deudor' })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Normal">Normal</option>
                <option value="Libre">Libre</option>
                <option value="Deudor">Deudor</option>
              </select>
            </div>
          </div>

          {!alumno && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Contraseña Inicial
              </label>
              <input
                type="text"
                value={formData.password_hash}
                onChange={(e) => setFormData({ ...formData, password_hash: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                placeholder="Contraseña para ingresar"
              />
            </div>
          )}

          {alumno && (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Última conexión:</span>
              <span className="font-semibold text-slate-200">
                {alumno.ultima_conexion ? formatearFechaHora(alumno.ultima_conexion) : 'Sin registros (nunca)'}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Observaciones / Comentario
            </label>
            <textarea
              rows={2}
              value={formData.comentario}
              onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              placeholder="Notas sobre el alumno, temas a reforzar, etc."
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Guardando...' : 'Guardar Alumno'}</span>
            </button>
          </div>
        </form>
      </div>

      <ConfirmacionModal
        isOpen={showConfirmacion}
        title={alumno ? 'Confirmar Modificación de Alumno' : 'Confirmar Alta de Nuevo Alumno'}
        subtitle="Verifica que los datos del alumno sean correctos antes de guardarlos."
        icon={<User className="w-5 h-5 text-blue-400" />}
        detalles={detallesConfirmacion}
        onConfirmar={handleConfirmedSave}
        onCancelar={() => setShowConfirmacion(false)}
        loading={loading}
        textoConfirmar={alumno ? 'Guardar Cambios' : 'Confirmar y Registrar'}
        colorBoton="blue"
      />
    </div>
  );
};
