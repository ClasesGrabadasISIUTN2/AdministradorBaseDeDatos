import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  DollarSign,
  Save,
  AlertCircle,
  Users,
  Link as LinkIcon,
  CheckCircle2,
  UserCheck,
  ArrowRight,
  Info,
  Sparkles,
} from 'lucide-react';
import { Reserva, Alumno } from '../types';
import { aFechaInput, formatearFecha } from '../utils/date';
import { ConfirmacionModal, DetalleConfirmacion } from './ConfirmacionModal';

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
  // Alumno 1 (Titular) State
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

  // Alumno 2 (Integrante Grupal - Segundo Modal Sincronizado) State
  const [alumnoId2, setAlumnoId2] = useState<number>(alumnos[1]?.id || alumnos[0]?.id || 2);
  const [estado2, setEstado2] = useState<string>('debe');

  // Loading & Error States
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmacion, setShowConfirmacion] = useState<boolean>(false);

  // Parse first email from input
  const esGrupal = tipoClase.includes('grupal');
  const primerEmail = integrantesInput.split(',')[0]?.trim() || '';
  const isDualModal = !reserva && esGrupal && primerEmail.length > 0;

  // Search for alumno by email when primerEmail changes
  const alumno2Encontrado = alumnos.find(
    (a) => a.correo.toLowerCase().trim() === primerEmail.toLowerCase()
  );

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
      const otroAlumno = alumnos.find((a) => a.id !== (alumnos[0]?.id || 1));
      if (otroAlumno) setAlumnoId2(otroAlumno.id);
      setEstado2('debe');
    }
    setError(null);
    setShowConfirmacion(false);
  }, [reserva, isOpen, alumnos]);

  // When primerEmail matches an alumno, automatically select that alumno in alumnoId2
  useEffect(() => {
    if (alumno2Encontrado) {
      setAlumnoId2(alumno2Encontrado.id);
    }
  }, [alumno2Encontrado]);

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

  const alumnoSeleccionado = alumnos.find((a) => a.id === alumnoId);
  const alumno2Seleccionado = alumnos.find((a) => a.id === alumnoId2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fechaRealizado || !horaInicio) {
      setError('Debes indicar fecha y horario para la clase.');
      return;
    }

    if (isDualModal) {
      if (!alumnoId2) {
        setError('Debes seleccionar o vincular un alumno registrado para el segundo integrante.');
        return;
      }
      if (alumnoId === alumnoId2) {
        setError('El alumno titular y el segundo integrante no pueden ser la misma persona.');
        return;
      }
    }

    setShowConfirmacion(true);
  };

  const handleConfirmedSave = async () => {
    setLoading(true);
    setError(null);

    const celdas = getDerivedCells();

    try {
      if (isDualModal && alumno2Seleccionado) {
        // Create 2 independent reservations for each student
        const reserva1 = {
          alumno_id: alumnoId,
          fecha_realizado: aFechaInput(fechaRealizado),
          fecha_reservada_texto: `Clase ${horaInicio} (${duracionHoras} hs)`,
          tipo_clase: tipoClase,
          estado: estado,
          precio: precio,
          celdas,
          integrantes: [alumno2Seleccionado.correo],
        };

        const reserva2 = {
          alumno_id: alumnoId2,
          fecha_realizado: aFechaInput(fechaRealizado),
          fecha_reservada_texto: `Clase ${horaInicio} (${duracionHoras} hs)`,
          tipo_clase: tipoClase,
          estado: estado2,
          precio: precio,
          celdas,
          integrantes: alumnoSeleccionado ? [alumnoSeleccionado.correo] : [],
        };

        await onSave([reserva1, reserva2]);
      } else {
        const integrantes = integrantesInput
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);

        await onSave({
          alumno_id: alumnoId,
          fecha_realizado: aFechaInput(fechaRealizado),
          fecha_reservada_texto: `Clase ${horaInicio} (${duracionHoras} hs)`,
          tipo_clase: tipoClase,
          estado: estado,
          precio: precio,
          celdas,
          integrantes,
        });
      }

      setShowConfirmacion(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la reserva');
      setShowConfirmacion(false);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const tipoClaseLabels: Record<string, string> = {
    estandar_individual: 'Estándar Individual',
    estandar_grupal: 'Estándar Grupal',
    tp_individual: 'TP Individual',
    tp_grupal: 'TP Grupal',
    consulta_individual: 'Consulta Individual',
    consulta_grupal: 'Consulta Grupal',
  };

  const estadoLabels: Record<string, string> = {
    debe: 'Debe (Pendiente de pago)',
    pack: 'Pack (Cubierta por horas)',
    pagada: 'Pagada',
    cancelada: 'Cancelada',
  };

  const detallesConfirmacion: DetalleConfirmacion[] = isDualModal
    ? [
        {
          label: 'Modalidad de Registro',
          valor: '2 Reservas Grupales Independientes',
          destacado: true,
        },
        {
          label: 'Reserva 1 - Titular',
          valor: alumnoSeleccionado
            ? `${alumnoSeleccionado.nombre} ${alumnoSeleccionado.apellido || ''} (${alumnoSeleccionado.correo})`
            : `ID #${alumnoId}`,
          destacado: true,
        },
        {
          label: 'Estado Pago Reserva 1',
          valor: estadoLabels[estado] || estado,
        },
        {
          label: 'Reserva 2 - Integrante',
          valor: alumno2Seleccionado
            ? `${alumno2Seleccionado.nombre} ${alumno2Seleccionado.apellido || ''} (${alumno2Seleccionado.correo})`
            : `ID #${alumnoId2}`,
          destacado: true,
        },
        {
          label: 'Estado Pago Reserva 2',
          valor: estadoLabels[estado2] || estado2,
        },
        {
          label: 'Fecha Programada',
          valor: formatearFecha(fechaRealizado, { conDiaSemana: true }),
          destacado: true,
        },
        {
          label: 'Horario y Duración',
          valor: `${horaInicio} hs (${duracionHoras} ${duracionHoras === 1 ? 'hora' : 'horas'})`,
          mono: true,
        },
        {
          label: 'Tipo de Clase',
          valor: tipoClaseLabels[tipoClase] || tipoClase,
        },
        {
          label: 'Precio Individual',
          valor: `${formatMoney(precio)} c/u`,
          destacado: true,
          mono: true,
        },
      ]
    : [
        {
          label: 'Alumno Titular',
          valor: alumnoSeleccionado
            ? `${alumnoSeleccionado.nombre} ${alumnoSeleccionado.apellido || ''} (${alumnoSeleccionado.correo})`
            : `ID #${alumnoId}`,
          destacado: true,
        },
        {
          label: 'Fecha Programada',
          valor: formatearFecha(fechaRealizado, { conDiaSemana: true }),
          destacado: true,
        },
        {
          label: 'Horario y Duración',
          valor: `${horaInicio} hs (${duracionHoras} ${duracionHoras === 1 ? 'hora' : 'horas'})`,
          mono: true,
        },
        {
          label: 'Modalidad',
          valor: tipoClaseLabels[tipoClase] || tipoClase,
        },
        {
          label: 'Importe / Precio',
          valor: formatMoney(precio),
          destacado: true,
        },
        {
          label: 'Estado de Pago',
          valor: estadoLabels[estado] || estado,
        },
        ...(integrantesInput.trim()
          ? [
              {
                label: 'Integrantes',
                valor: integrantesInput,
                mono: true,
              },
            ]
          : []),
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div
        className={`bg-slate-900 border border-slate-800 rounded-2xl w-full overflow-hidden shadow-2xl my-8 transition-all duration-300 ${
          isDualModal ? 'max-w-5xl' : 'max-w-md'
        }`}
      >
        {/* Header Principal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            {isDualModal ? (
              <div className="p-2 rounded-xl bg-cyan-950/70 border border-cyan-800/50 text-cyan-400">
                <Users className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-800/50 text-emerald-400">
                <Calendar className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                  {reserva
                    ? 'Editar Reserva de Clase'
                    : isDualModal
                    ? 'Agendar Reserva Grupal (2 Integrantes)'
                    : 'Agendar Nueva Reserva'}
                </h3>
                {isDualModal && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    2 Reservas Independientes
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {isDualModal
                  ? 'Se generará una reserva individual para cada integrante con sincronización automática.'
                  : 'Completa los datos para registrar la clase en el calendario.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificación informativa cuando se activa modo grupal */}
        {esGrupal && !primerEmail && (
          <div className="px-5 py-2.5 bg-blue-950/40 border-b border-blue-800/40 flex items-center gap-2 text-xs text-blue-300">
            <Info className="w-4 h-4 shrink-0 text-blue-400" />
            <span>
              <strong>Clase grupal seleccionada:</strong> ingresa el correo del integrante abajo para abrir automáticamente el panel de su reserva paralela.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="text-xs">
          {error && (
            <div className="m-5 p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Modal Grid: Single column or Side-by-Side Dual Modal */}
          <div
            className={`p-5 ${
              isDualModal ? 'grid grid-cols-1 md:grid-cols-2 gap-5' : 'space-y-4'
            }`}
          >
            {/* PANEL 1: RESERVA 1 - ALUMNO TITULAR */}
            <div
              className={`space-y-3.5 ${
                isDualModal
                  ? 'bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm'
                  : ''
              }`}
            >
              {isDualModal && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    Reserva 1: Alumno Titular
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Principal</span>
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
                    Hora de Inicio *
                  </label>
                  <input
                    type="time"
                    required
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
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
                    Precio (ARS) {isDualModal && <span className="text-slate-400 text-[10px]">c/u</span>}
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
                    Estado de Pago Titular
                  </label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="debe">Debe (Pendiente)</option>
                    <option value="pack">Pack (Horas a favor)</option>
                    <option value="pagada">Pagada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-300">
                    {esGrupal ? 'Correo del Integrante Grupal *' : 'Integrantes Adicionales'}
                  </label>
                  {esGrupal && (
                    <span className="text-[10px] text-cyan-400 font-medium">
                      Activa 2do modal al ingresar
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={integrantesInput}
                  onChange={(e) => setIntegrantesInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  placeholder={
                    esGrupal
                      ? 'Ej: integrante@gmail.com'
                      : 'alumno2@gmail.com, alumno3@frsf.utn.edu.ar'
                  }
                />
                {esGrupal && !primerEmail && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    💡 Escribe el correo del alumno para desplegar su reserva idéntica al lado.
                  </p>
                )}
              </div>
            </div>

            {/* PANEL 2: RESERVA 2 - INTEGRANTE GRUPAL (APARECE AL LADO) */}
            {isDualModal && (
              <div className="space-y-3.5 bg-slate-800/40 border border-cyan-500/40 rounded-xl p-4 shadow-xl shadow-cyan-950/20 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-cyan-800/40">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    Reserva 2: Integrante Grupal
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                    Independiente
                  </span>
                </div>

                {/* Búsqueda automática del Alumno por correo */}
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Alumno Integrante (Búsqueda Automática)
                  </label>

                  {alumno2Encontrado ? (
                    <div className="p-3 bg-emerald-950/30 border border-emerald-700/50 rounded-lg mb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-100 text-xs">
                              {alumno2Encontrado.nombre} {alumno2Encontrado.apellido || ''}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {alumno2Encontrado.correo}
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-semibold">
                          Saldo: {alumno2Encontrado.horas_a_favor || 0} hs
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-950/30 border border-amber-700/50 rounded-lg mb-2 text-amber-300 text-[11px]">
                      <div className="font-semibold flex items-center gap-1.5 mb-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        No existe alumno con correo "{primerEmail}"
                      </div>
                      <p className="text-amber-300/80">
                        Selecciona abajo a qué alumno registrado corresponde esta reserva:
                      </p>
                    </div>
                  )}

                  {/* Selector para cambiar o confirmar alumno */}
                  <select
                    value={alumnoId2}
                    onChange={(e) => {
                      const id = parseInt(e.target.value, 10);
                      setAlumnoId2(id);
                      const chosen = alumnos.find((a) => a.id === id);
                      if (chosen) {
                        setIntegrantesInput(chosen.correo);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    {alumnos.map((a) => (
                      <option key={a.id} value={a.id} disabled={a.id === alumnoId}>
                        {a.nombre} {a.apellido || ''} ({a.correo}) - Saldo: {a.horas_a_favor || 0} hs
                        {a.id === alumnoId ? ' (Alumno Titular)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Datos Sincronizados Automáticamente con Reserva 1 */}
                <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-cyan-400 font-semibold border-b border-slate-800 pb-1.5">
                    <span className="flex items-center gap-1">
                      <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
                      Datos Sincronizados de la Clase
                    </span>
                    <span className="text-slate-400 font-normal">Heredados de Titular</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400">Fecha:</span>{' '}
                      <span className="font-semibold text-slate-200">
                        {formatearFecha(fechaRealizado, { conDiaSemana: false })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Horario:</span>{' '}
                      <span className="font-mono font-semibold text-slate-200">
                        {horaInicio} hs ({duracionHoras} hs)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Modalidad:</span>{' '}
                      <span className="font-semibold text-slate-200">
                        {tipoClaseLabels[tipoClase] || tipoClase}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Precio Individual:</span>{' '}
                      <span className="font-mono font-bold text-emerald-400">
                        {formatMoney(precio)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* El resto de los datos pedidos nuevamente */}
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Estado de Pago de este Integrante *
                  </label>
                  <select
                    value={estado2}
                    onChange={(e) => setEstado2(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="debe">Debe (Pendiente de cobro)</option>
                    <option value="pack">Pack (Cubierta por saldo de horas del alumno)</option>
                    <option value="pagada">Pagada (Cobro recibido)</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                  {alumno2Seleccionado && estado2 === 'pack' && (
                    <p className="text-[11px] text-cyan-400 mt-1">
                      El alumno cuenta con <strong>{alumno2Seleccionado.horas_a_favor || 0} horas</strong> en su pack.
                    </p>
                  )}
                </div>

                <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Integrante vinculado:</span>
                  <span className="font-semibold text-slate-300">
                    {alumnoSeleccionado?.nombre} {alumnoSeleccionado?.apellido || ''} (Titular)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer con Acciones */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-t border-slate-800 bg-slate-800/40">
            <div className="text-slate-400 text-[11px] hidden sm:block">
              {isDualModal
                ? 'Se guardarán 2 reservas con sus respectivos estados de cobro.'
                : 'Se guardará 1 reserva individual en la agenda.'}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex items-center gap-1.5 px-4 py-2 text-white font-semibold rounded-lg shadow transition disabled:opacity-50 ${
                  isDualModal
                    ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                }`}
              >
                {isDualModal ? (
                  <>
                    <Users className="w-4 h-4" />
                    <span>{loading ? 'Guardando...' : 'Guardar 2 Reservas Grupales'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{loading ? 'Guardando...' : 'Guardar Reserva'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal de Confirmación previo con el resumen de ambas reservas */}
      <ConfirmacionModal
        isOpen={showConfirmacion}
        title={
          reserva
            ? 'Confirmar Modificación de Reserva'
            : isDualModal
            ? 'Confirmar Creación de 2 Reservas Grupales'
            : 'Confirmar Nueva Reserva de Clase'
        }
        subtitle={
          isDualModal
            ? 'Verifica los datos de ambas reservas independientes antes de asentarlas.'
            : 'Verifica que el alumno, fecha, horario e importe sean correctos.'
        }
        icon={
          isDualModal ? (
            <Users className="w-5 h-5 text-cyan-400" />
          ) : (
            <Calendar className="w-5 h-5 text-emerald-400" />
          )
        }
        detalles={detallesConfirmacion}
        onConfirmar={handleConfirmedSave}
        onCancelar={() => setShowConfirmacion(false)}
        loading={loading}
        textoConfirmar={
          isDualModal ? 'Confirmar y Guardar Ambas Reservas' : 'Confirmar Reserva'
        }
        colorBoton={isDualModal ? 'cyan' : 'emerald'}
      />
    </div>
  );
};
