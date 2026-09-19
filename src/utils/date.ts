// Utilidades para manejo y formateo consistente de fechas

const DIAS_SEMANA_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_SEMANA_COMPLETO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

/**
 * Limpia y extrae la porción YYYY-MM-DD de cualquier string de fecha o ISO timestamp
 */
export function extraerFechaYMD(fechaStr?: string | null): string {
  if (!fechaStr) return '';
  const trimmed = fechaStr.trim();
  if (trimmed.includes('T')) return trimmed.split('T')[0];
  if (trimmed.includes(' ')) return trimmed.split(' ')[0];
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  return trimmed.slice(0, 10);
}

/**
 * Devuelve el valor adecuado para inputs de tipo <input type="date" /> (YYYY-MM-DD)
 */
export function aFechaInput(fechaStr?: string | null): string {
  return extraerFechaYMD(fechaStr);
}

/**
 * Formatea una fecha (incluso si viene como ISO '2026-09-19T00:00:00.000Z') al formato estándar DD/MM/AAAA
 * Ejemplos:
 *  - formatearFecha('2026-09-19T00:00:00.000Z') -> '19/09/2026'
 *  - formatearFecha('2026-09-19', { conDiaSemana: true }) -> 'Sáb 19/09/2026'
 *  - formatearFecha('2026-09-19', { formatoLargo: true }) -> '19 de septiembre de 2026'
 */
export function formatearFecha(
  fechaStr?: string | null,
  opciones?: {
    conDiaSemana?: boolean;
    formatoLargo?: boolean;
    conDiaSemanaCompleto?: boolean;
    textoVacio?: string;
  }
): string {
  const textoVacio = opciones?.textoVacio ?? '-';
  if (!fechaStr) return textoVacio;

  const ymd = extraerFechaYMD(fechaStr);
  const parts = ymd.split('-');

  if (parts.length === 3 && parts[0].length === 4) {
    const anio = parseInt(parts[0], 10);
    const mes = parseInt(parts[1], 10);
    const dia = parseInt(parts[2], 10);

    if (!isNaN(anio) && !isNaN(mes) && !isNaN(dia)) {
      // Creamos la fecha en hora local para obtener el día de la semana sin desviación UTC
      const localDate = new Date(anio, mes - 1, dia);
      const diaSemanaIndex = localDate.getDay();

      if (opciones?.formatoLargo) {
        const nombreMes = MESES[mes - 1] || `${mes}`;
        if (opciones?.conDiaSemanaCompleto) {
          return `${DIAS_SEMANA_COMPLETO[diaSemanaIndex]}, ${dia} de ${nombreMes} de ${anio}`;
        }
        return `${dia} de ${nombreMes} de ${anio}`;
      }

      const diaPad = String(dia).padStart(2, '0');
      const mesPad = String(mes).padStart(2, '0');
      const base = `${diaPad}/${mesPad}/${anio}`;

      if (opciones?.conDiaSemanaCompleto) {
        return `${DIAS_SEMANA_COMPLETO[diaSemanaIndex]} ${base}`;
      }
      if (opciones?.conDiaSemana) {
        return `${DIAS_SEMANA_CORTO[diaSemanaIndex]} ${base}`;
      }

      return base;
    }
  }

  // Fallback si no cumple YYYY-MM-DD
  return fechaStr;
}

/**
 * Calcula la diferencia en días con respecto a hoy (0 = hoy, 1 = mañana, <0 = pasado)
 */
export function getDiasDiferenciaHoy(fechaStr?: string | null): number {
  if (!fechaStr) return 999;
  const ymd = extraerFechaYMD(fechaStr);
  const parts = ymd.split('-');
  if (parts.length !== 3) return 999;

  const anio = parseInt(parts[0], 10);
  const mes = parseInt(parts[1], 10);
  const dia = parseInt(parts[2], 10);

  const fechaLocal = new Date(anio, mes - 1, dia);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fechaLocal.setHours(0, 0, 0, 0);

  return Math.round((fechaLocal.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}
