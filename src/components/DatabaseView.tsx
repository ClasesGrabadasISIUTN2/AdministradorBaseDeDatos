import React, { useState } from 'react';
import {
  Database,
  Terminal,
  Play,
  CheckCircle2,
  AlertTriangle,
  Code,
  Table,
  Layers,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { DatabaseStatus } from '../types';
import { api } from '../services/api';

interface DatabaseViewProps {
  dbStatus: DatabaseStatus | null;
  onRefreshStatus: () => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  dbStatus,
  onRefreshStatus,
}) => {
  const [sqlQuery, setSqlQuery] = useState<string>(
    'SELECT id, nombre, apellido, correo, materia, horas_a_favor, dinero_debe FROM alumnos ORDER BY id ASC LIMIT 10;'
  );
  const [sqlResult, setSqlResult] = useState<any | null>(null);
  const [sqlLoading, setSqlLoading] = useState<boolean>(false);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const presets = [
    {
      title: 'Top 10 Alumnos',
      query: 'SELECT id, nombre, apellido, correo, materia, horas_a_favor, condicion_pago FROM alumnos ORDER BY id ASC LIMIT 10;',
    },
    {
      title: 'Reservas por Estado',
      query: 'SELECT estado, COUNT(*) as cantidad, SUM(precio) as monto_total FROM reservas GROUP BY estado ORDER BY cantidad DESC;',
    },
    {
      title: 'Clases Adeudadas (Debe)',
      query: 'SELECT id, alumno_id, fecha_realizado, codigo, precio, tipo_clase FROM reservas WHERE estado = \'debe\' ORDER BY fecha_realizado ASC LIMIT 10;',
    },
    {
      title: 'Integrantes de Reservas Grupales',
      query: 'SELECT * FROM reserva_integrantes ORDER BY id DESC LIMIT 10;',
    },
  ];

  const handleRunSql = async () => {
    setSqlLoading(true);
    setSqlError(null);
    try {
      const res = await api.runSqlQuery(sqlQuery);
      setSqlResult(res);
    } catch (err: any) {
      setSqlError(err.message || 'Error al ejecutar la consulta');
    } finally {
      setSqlLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                dbStatus?.connected
                  ? 'bg-emerald-950/60 border border-emerald-600/50 text-emerald-400'
                  : 'bg-amber-950/60 border border-amber-600/50 text-amber-400'
              }`}
            >
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  Estado de la Base de Datos
                </h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    dbStatus?.connected
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                      : 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                  }`}
                >
                  {dbStatus?.connected
                    ? 'PostgreSQL Conectado'
                    : 'Modo Sincronizado / Vista Previa'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {dbStatus?.connected
                  ? `Conexión activa mediante pg pool. Latencia de prueba: ${dbStatus.latencyMs ?? 5} ms`
                  : 'Operando con almacén de datos sincronizado en memoria para pruebas directas en vivo.'}
              </p>
            </div>
          </div>

          <button
            onClick={onRefreshStatus}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span>Verificar Conexión</span>
          </button>
        </div>

        {/* Database Table Counts */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800">
          <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-lg">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Tabla `alumnos`
            </div>
            <div className="text-xl font-bold font-mono text-slate-100 mt-0.5">
              {dbStatus?.tableCounts?.alumnos ?? 0} registros
            </div>
          </div>
          <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-lg">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Tabla `reservas`
            </div>
            <div className="text-xl font-bold font-mono text-slate-100 mt-0.5">
              {dbStatus?.tableCounts?.reservas ?? 0} registros
            </div>
          </div>
          <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-lg">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Tabla `reserva_integrantes`
            </div>
            <div className="text-xl font-bold font-mono text-slate-100 mt-0.5">
              {dbStatus?.tableCounts?.reserva_integrantes ?? 0} registros
            </div>
          </div>
        </div>

        {!dbStatus?.connected && (
          <div className="mt-4 p-3 bg-amber-950/20 border border-amber-800/40 rounded-lg text-xs text-amber-200/90 leading-relaxed">
            <div className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>¿Cómo conectar tu base de datos PostgreSQL de Render / Supabase / Neon / Cloud SQL?</span>
            </div>
            Configura la variable de entorno <code className="font-mono bg-amber-950/60 px-1 py-0.5 rounded text-amber-300">DATABASE_URL</code> en los ajustes del proyecto con el formato:
            <code className="block font-mono bg-slate-950 p-2 rounded text-slate-300 mt-1 border border-slate-800 text-[11px]">
              postgresql://usuario:password@host:5432/nombre_base?sslmode=require
            </code>
          </div>
        )}
      </div>

      {/* SQL Interactive Console */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              Consola de Consultas SQL (Solo Lectura)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Consultas SELECT directas para auditoría
          </span>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 mr-1 font-medium">Atajos:</span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setSqlQuery(p.query)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 rounded text-[11px] font-mono border border-slate-700 transition"
            >
              {p.title}
            </button>
          ))}
        </div>

        {/* Query Input */}
        <div className="space-y-2">
          <textarea
            rows={3}
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 shadow-inner"
            placeholder="SELECT * FROM alumnos LIMIT 5;"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              * Por seguridad del sistema, solo se ejecutan sentencias de lectura.
            </span>
            <button
              onClick={handleRunSql}
              disabled={sqlLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{sqlLoading ? 'Ejecutando...' : 'Ejecutar Consulta'}</span>
            </button>
          </div>
        </div>

        {/* Query Results */}
        {sqlError && (
          <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-lg text-xs text-rose-300 font-mono">
            {sqlError}
          </div>
        )}

        {sqlResult && (
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
            <div className="p-2.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
              <span>Filas obtenidas: {sqlResult.rowCount ?? sqlResult.rows?.length ?? 0}</span>
              {sqlResult.latencyMs !== undefined && (
                <span>Tiempo: {sqlResult.latencyMs} ms</span>
              )}
            </div>

            <div className="overflow-x-auto max-h-72">
              {Array.isArray(sqlResult.rows) && sqlResult.rows.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                      {Object.keys(sqlResult.rows[0]).map((key) => (
                        <th key={key} className="py-2 px-3 whitespace-nowrap">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {sqlResult.rows.map((row: any, rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-slate-900/40 text-slate-300">
                        {Object.values(row).map((val: any, cIdx: number) => (
                          <td key={cIdx} className="py-1.5 px-3 whitespace-nowrap">
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs font-mono">
                  La consulta se ejecutó pero no devolvió filas.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* API Endpoints & Apps Script Replacement Reference */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
          <Code className="w-4 h-4 text-emerald-400" />
          <span>Compatibilidad de Endpoints (Reemplazo directo de Apps Script / CRUD.gs)</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Este servidor responde tanto en endpoints REST modernos como en las rutas clásicas que consumían tus páginas web (<code className="font-mono text-slate-300">Login.html</code>, <code className="font-mono text-slate-300">Registro.html</code>, <code className="font-mono text-slate-300">index.html</code>, <code className="font-mono text-slate-300">RecuperarContraseña.html</code>).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono mt-3">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
            <div className="text-emerald-400 font-bold">POST / (con "funcion")</div>
            <div className="text-slate-300">• agregarAlumno (Registro)</div>
            <div className="text-slate-300">• asignarHorario (Reservar clase)</div>
            <div className="text-slate-300">• registrarPagoAutomatico (Webhook)</div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
            <div className="text-blue-400 font-bold">GET / (con "funcion")</div>
            <div className="text-slate-300">• validarUsuarioSimplificado (Login)</div>
            <div className="text-slate-300">• cancelarReserva (Cancelar)</div>
            <div className="text-slate-300">• devolverDeuda (Cálculo de mora)</div>
            <div className="text-slate-300">• verificarCorreos (Grupales)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
