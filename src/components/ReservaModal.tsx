import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, DollarSign, Save, AlertCircle, Users } from 'lucide-react';
import { Reserva, Alumno } from '../types';
import { aFechaInput } from '../utils/date';

interface ReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  reserva?: Reserva | null;
  alumnos: Alumno[];
}

export const ReservaModal: React.FC<ReservaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  reserva,
  alumnos,
}) => {
  const [alumnoId, setAlumnoId] = useState<number>(alumnos[0]?.id || 1);
  const [fechaRealizado, setFechaRealizado] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [horaInicio, setHoraInicio] = useState<string>('10:00');
  const [duracionHoras, setDuracionHoras] = useState<number>(2);
  const [tipoClase, setTipoClase] = useState<string>('estandar_individual');
  const [estado, setEstado] = useState<string>('debe');
  const [precio, setPrecio] = useState<number>(8000);
  const [integrantesInput, setIntegrantesInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reserva) {
      setAlumnoId(reserva.alumno_id);
      setFechaRealizado(aFechaInput(reserva.fecha_realizado) || new Date().toISOString().slice(0, 10));
      setTipoClase(reserva.tipo_clase || 'estandar_individual');
      setEstado(reserva.estado);
      setPrecio(Number(reserva.precio || 0));
      setDuracionHoras(Array.isArray(reserva.celdas) ? reserva.celdas.length : 2);
      setHoraInicio(reserva.horaInicio || '10:00');
      setIntegrantesInput(reserva.integrantes ? reserva.integrantes.join(', ') : '');
    } else {
      if (alumnos.length > 0) setAlumnoId(alumnos[0].id);
      setFechaRealizado(new Date().toISOString().slice(0, 10));
      setTipoClase('estandar_individual');
      setEstado('debe');
      setPrecio(8000);
      setDuracionHoras(2);
      setHoraInicio('10:00');
      setIntegrantesInput('');
    }
    setError(null);
  }, [reserva, isOpen, alumnos]);

  if (!isOpen) return null;

  // Derive dummy cells based on selected time
  const getDerivedCells = () => {
    const horaNum = parseInt(horaInicio.split(':')[0], 10) || 10;
    const baseRow = horaNum - 5;
    const celdas: string[] = [];
    for (let i = 0; i < duracionHoras; i++) {
      celdas.push(`C${baseRow + i}`);
    }
    return celdas;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const integrantes = integrantesInput
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    try {
      await onSave({
        alumno_id: alumnoId,
        fecha_realizado: aFechaInput(fechaRealizado),
        fecha_reservada_texto: `Clase ${horaInicio} (${duracionHoras} hs)`,
        tipo_clase: tipoClase,
        estado: estado,
        precio: precio,
        celdas: getDerivedCells(),
        integrantes,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la reserva');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl my-8">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              {reserva ? 'Editar Reserva / Clase' : 'Agendar Nueva Reserva'}
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
              Alumno Titular *
            </label>
            <select
              value={alumnoId}
              onChange={(e) => setAlumnoId(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {alumnos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} {a.apellido || ''} ({a.correo}) - Saldo: {a.horas_a_favor || 0} hs
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Fecha de la Clase *
              </label>
              <input
                type="date"
                required
                value={fechaRealizado}
                onChange={(e) => setFechaRealizado(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Hora de Inicio
              </label>
              <select
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="08:15">08:15 hs</option>
                <option value="10:00">10:00 hs</option>
                <option value="12:00">12:00 hs</option>
                <option value="14:00">14:00 hs</option>
                <option value="16:00">16:00 hs</option>
                <option value="18:00">18:00 hs</option>
                <option value="20:00">20:00 hs</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Duración (Horas)
              </label>
              <input
                type="number"
                min={1}
                max={6}
                value={duracionHoras}
                onChange={(e) => setDuracionHoras(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Precio (ARS)
              </label>
              <input
                type="number"
                min={0}
                step={500}
                value={precio}
                onChange={(e) => setPrecio(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Modalidad
              </label>
              <select
                value={tipoClase}
                onChange={(e) => setTipoClase(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="estandar_individual">Estándar Individual</option>
                <option value="estandar_grupal">Estándar Grupal</option>
                <option value="tp_individual">TP Individual</option>
                <option value="tp_grupal">TP Grupal</option>
                <option value="consulta_individual">Consulta Individual</option>
                <option value="consulta_grupal">Consulta Grupal</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Estado de Pago
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="debe">Debe (Pendiente de pago)</option>
                <option value="pack">Pack (Cubierta por horas)</option>
                <option value="pagada">Pagada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Integrantes Adicionales (Correos separados por coma)
            </label>
            <input
              type="text"
              value={integrantesInput}
              onChange={(e) => setIntegrantesInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              placeholder="alumno2@gmail.com, alumno3@frsf.utn.edu.ar"
            />
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
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Guardando...' : 'Guardar Reserva'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
