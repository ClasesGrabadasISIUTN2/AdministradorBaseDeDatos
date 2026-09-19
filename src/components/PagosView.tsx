import React, { useState } from 'react';
import {
  CreditCard,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Package,
  Calendar,
  ChevronDown,
  ChevronRight,
  Phone,
  Mail,
  User,
  PlusCircle,
} from 'lucide-react';
import { Alumno, Reserva } from '../types';

interface PagosViewProps {
  pagosData: { deudasPorAlumno: any[]; pagosRecientes: Reserva[] };
  alumnos: Alumno[];
  onOpenRegistrarPago: (alumnoId?: number) => void;
  onOpenHabilitarPack: (alumnoId?: number) => void;
  onVerAlumnoPorId: (alumnoId: number) => void;
}

export const PagosView: React.FC<PagosViewProps> = ({
  pagosData,
  alumnos,
  onOpenRegistrarPago,
  onOpenHabilitarPack,
  onVerAlumnoPorId,
}) => {
  const [expandedAlumnoId, setExpandedAlumnoId] = useState<number | null>(null);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const toggleExpand = (alumnoId: number) => {
    setExpandedAlumnoId((prev) => (prev === alumnoId ? null : alumnoId));
  };

  const totalDeudaAcumulada = pagosData.deudasPorAlumno.reduce(
    (sum, d) => sum + (d.totalDeuda || 0),
    0
  );

  const totalMoraAcumulada = pagosData.deudasPorAlumno.reduce(
    (sum, d) => sum + (d.subtotalMora || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">
            Administración de Pagos, Deudas y Packs
          </h2>
          <p className="text-xs text-slate-400">
            Cálculo automático de mora por atraso (regla 5% + 1% diario compuesto) y conciliación de saldos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenRegistrarPago()}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition"
          >
            <CreditCard className="w-4 h-4" />
            <span>+ Registrar Pago</span>
          </button>
          <button
            onClick={() => onOpenHabilitarPack()}
            className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow transition"
          >
            <Package className="w-4 h-4" />
            <span>+ Cargar Pack</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Deuda Total Pendiente</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {formatMoney(totalDeudaAcumulada)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {pagosData.deudasPorAlumno.length} alumnos con pagos pendientes
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Mora Acumulada por Retraso</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {formatMoney(totalMoraAcumulada)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Calculado automáticamente según fecha de clase
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Pagos Registrados Recientes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {pagosData.pagosRecientes.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Últimas transacciones conciliadas
          </div>
        </div>
      </div>

      {/* Deudas por Alumno List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              Alumnos con Deuda y Desglose de Mora
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {pagosData.deudasPorAlumno.length} alumnos
          </span>
        </div>

        {pagosData.deudasPorAlumno.length === 0 ? (
          <div className="p-12 text-center text-emerald-400 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8" />
            <span className="font-semibold text-sm">¡Al día! No existen alumnos con deudas pendientes.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {pagosData.deudasPorAlumno.map((d) => {
              const isExpanded = expandedAlumnoId === d.alumno_id;

              return (
                <div key={d.alumno_id} className="transition">
                  {/* Header Row for Student */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleExpand(d.alumno_id)}
                        className="p-1 text-slate-400 hover:text-slate-200"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-blue-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onVerAlumnoPorId(d.alumno_id)}
                            className="font-bold text-slate-100 hover:text-blue-400 text-left transition"
                          >
                            {d.nombre} {d.apellido || ''}
                          </button>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-300 border border-rose-800/60">
                            {d.condicion_pago || 'Mora'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                          <span className="font-mono text-[11px]">{d.correo}</span>
                          {d.telefono && (
                            <a
                              href={`https://wa.me/${d.telefono.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{d.telefono}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <div className="text-right">
                        <div className="font-mono font-bold text-rose-400 text-sm">
                          {formatMoney(d.totalDeuda)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Base: {formatMoney(d.subtotalBase)} + Mora: {formatMoney(d.subtotalMora)}
                        </div>
                      </div>

                      <button
                        onClick={() => onOpenRegistrarPago(d.alumno_id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition"
                      >
                        Cobrar
                      </button>
                    </div>
                  </div>

                  {/* Expanded Items Breakdown */}
                  {isExpanded && d.itemsDeuda && d.itemsDeuda.length > 0 && (
                    <div className="px-6 pb-4 pt-1 bg-slate-950/40 border-t border-slate-800/60">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Clases pendientes de pago ({d.itemsDeuda.length}):
                      </div>
                      <div className="space-y-1.5">
                        {d.itemsDeuda.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-slate-300">
                                #{item.codigo}
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-200">
                                {item.fecha_realizado || item.fecha_reservada_texto}
                              </span>
                              <span
                                className={`text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded ${
                                  item.estado === 'cancelada'
                                    ? 'bg-slate-700 text-slate-300'
                                    : 'bg-rose-950 text-rose-300'
                                }`}
                              >
                                {item.estado}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 font-mono">
                              <span className="text-slate-400">
                                Base: {formatMoney(item.precioBase)}
                              </span>
                              {item.mora > 0 && (
                                <span className="text-amber-400 text-[11px]">
                                  + Mora: {formatMoney(item.mora)}
                                </span>
                              )}
                              <span className="font-bold text-slate-100">
                                Total: {formatMoney(item.total)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Payments Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              Historial de Pagos y Clases Pagadas
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {pagosData.pagosRecientes.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/20 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                <th className="py-2.5 px-4">Código</th>
                <th className="py-2.5 px-4">Alumno</th>
                <th className="py-2.5 px-4">Fecha Clase</th>
                <th className="py-2.5 px-4">Monto Cobrado</th>
                <th className="py-2.5 px-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {pagosData.pagosRecientes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No hay registros de pagos recientes.
                  </td>
                </tr>
              ) : (
                pagosData.pagosRecientes.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/20">
                    <td className="py-2.5 px-4 font-mono text-slate-300 font-semibold">
                      {p.codigo}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-slate-200">
                        {p.alumno_nombre} {p.alumno_apellido || ''}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-300">
                      {p.fecha_realizado}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-emerald-400">
                      {formatMoney(Number(p.precio || 0))}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 uppercase">
                        Pagada
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
