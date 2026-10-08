import React, { useState } from 'react';
import {
  X,
  Phone,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Users,
  AlertCircle,
  RotateCcw,
  Edit3,
} from 'lucide-react';
import { Alumno } from '../types';
import {
  generarMensajeReservaWhatsApp,
  limpiarTelefonoParaWhatsApp,
  getWhatsAppUrl,
  getWhatsAppWebUrl,
} from '../utils/whatsapp';

export interface WhatsAppReservaInfo {
  alumno: Alumno | null;
  alumnoNombre: string;
  alumnoTelefono: string;
  fechaRealizado: string | null;
  horaInicio?: string;
  duracionHoras?: number;
  estado: string;
}

interface WhatsAppReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: WhatsAppReservaInfo[];
}

export const WhatsAppReservaModal: React.FC<WhatsAppReservaModalProps> = ({
  isOpen,
  onClose,
  items,
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [telefonos, setTelefonos] = useState<Record<number, string>>({});
  const [mensajesEditados, setMensajesEditados] = useState<Record<number, string>>({});
  const [copiado, setCopiado] = useState<boolean>(false);

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[activeTab] || items[0];
  const telActual =
    telefonos[activeTab] !== undefined
      ? telefonos[activeTab]
      : currentItem.alumnoTelefono || currentItem.alumno?.telefono || '';

  const mensajeGenerado = generarMensajeReservaWhatsApp({
    nombreAlumno: currentItem.alumnoNombre,
    fechaRealizado: currentItem.fechaRealizado,
    horaInicio: currentItem.horaInicio,
    duracionHoras: currentItem.duracionHoras,
    estado: currentItem.estado,
  });

  const mensajeActual =
    mensajesEditados[activeTab] !== undefined
      ? mensajesEditados[activeTab]
      : mensajeGenerado;

  const waUrl = getWhatsAppUrl(telActual, mensajeActual);
  const waWebUrl = getWhatsAppWebUrl(telActual, mensajeActual);
  const telLimpio = limpiarTelefonoParaWhatsApp(telActual);

  const handleCopy = () => {
    navigator.clipboard.writeText(mensajeActual);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleRestablecerMensaje = () => {
    const next = { ...mensajesEditados };
    delete next[activeTab];
    setMensajesEditados(next);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-6 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base leading-tight">
                  Notificar Reserva por WhatsApp
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  Confirmación de Reserva
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Envía la confirmación al alumno con un clic al número registrado en su ficha.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-student Tabs if Grupal */}
        {items.length > 1 && (
          <div className="flex border-b border-slate-800 bg-slate-900/90 px-4 pt-2.5 gap-2">
            {items.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveTab(idx);
                  setCopiado(false);
                }}
                className={`px-3 py-2 rounded-t-xl text-xs font-semibold flex items-center gap-2 border-t border-x transition-colors cursor-pointer ${
                  activeTab === idx
                    ? 'bg-slate-800 border-slate-700 text-emerald-400'
                    : 'bg-slate-900/50 border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>
                  {idx + 1}. {item.alumnoNombre}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Phone row */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 sm:p-3.5 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Número registrado de <strong>{currentItem.alumnoNombre}</strong>:</span>
              </span>
              {telLimpio ? (
                <span className="text-xs font-mono font-semibold text-emerald-400">
                  +{telLimpio}
                </span>
              ) : (
                <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Sin teléfono en perfil
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={telActual}
                onChange={(e) =>
                  setTelefonos({ ...telefonos, [activeTab]: e.target.value })
                }
                placeholder="Ingresar o verificar número (ej: 3425123456 o +5493425123456)"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* WhatsApp Message Preview & Editable Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs text-slate-400 font-medium">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-slate-300">
                  <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mensaje a enviar:</span>
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5 rounded font-medium">
                  Editable
                </span>
              </div>
              <div className="flex items-center gap-2">
                {mensajesEditados[activeTab] !== undefined && (
                  <button
                    type="button"
                    onClick={handleRestablecerMensaje}
                    className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium transition cursor-pointer"
                    title="Restablecer al texto original generado"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restablecer</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold transition cursor-pointer"
                >
                  {copiado ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiado ? '¡Copiado!' : 'Copiar texto'}</span>
                </button>
              </div>
            </div>

            <textarea
              value={mensajeActual}
              onChange={(e) =>
                setMensajesEditados({
                  ...mensajesEditados,
                  [activeTab]: e.target.value,
                })
              }
              rows={11}
              placeholder="Puedes escribir o modificar el mensaje aquí antes de enviarlo..."
              className="w-full bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-3.5 font-mono text-xs text-slate-200 leading-relaxed shadow-inner focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 resize-y"
            />
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>✏️ Puedes modificar el texto libremente antes de presionar Enviar o Copiar.</span>
              <span className="font-mono text-[10px] text-slate-500">{mensajeActual.length} caracteres</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            Cerrar
          </button>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              {copiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiado ? 'Copiado al portapapeles' : 'Copiar'}</span>
            </button>

            <a
              href={waWebUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-600/60 text-emerald-300 text-xs font-semibold transition cursor-pointer"
              title="Abrir WhatsApp Web en pestaña del navegador"
            >
              <span>WhatsApp Web</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition active:scale-[0.98] cursor-pointer"
              title="Abrir chat directo en WhatsApp"
            >
              <MessageSquare className="w-4 h-4 fill-white/20" />
              <span>Abrir WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
