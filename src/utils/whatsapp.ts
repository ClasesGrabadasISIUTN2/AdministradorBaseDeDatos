import { extraerFechaYMD } from './date';

export function generarMensajeReservaWhatsApp(params: {
  nombreAlumno: string;
  fechaRealizado: string | null;
  horaInicio?: string;
  duracionHoras?: number;
  estado: string; // 'debe' | 'pack' | 'pagada' | 'cancelada'
}): string {
  const { nombreAlumno, fechaRealizado, horaInicio, duracionHoras = 1, estado } = params;

  // Extraer el nombre principal para el saludo amigable "¡Hola Martina! 👋"
  const soloNombre = nombreAlumno?.trim().split(' ')[0] || nombreAlumno || 'Alumno';

  // Formatear día de la semana y fecha: ej: "Miércoles 14/10"
  let fechaFormateada = '';
  if (fechaRealizado) {
    const ymd = extraerFechaYMD(fechaRealizado);
    const parts = ymd.split('-');
    if (parts.length === 3) {
      const anio = parseInt(parts[0], 10);
      const mes = parseInt(parts[1], 10);
      const dia = parseInt(parts[2], 10);
      const localDate = new Date(anio, mes - 1, dia);
      const DIAS_COMPLETO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const diaSemana = DIAS_COMPLETO[localDate.getDay()] || '';
      const diaPad = String(dia).padStart(2, '0');
      const mesPad = String(mes).padStart(2, '0');
      fechaFormateada = `${diaSemana} ${diaPad}/${mesPad}`;
    } else {
      fechaFormateada = fechaRealizado;
    }
  } else {
    fechaFormateada = 'Fecha a coordinar';
  }

  const horaStr = horaInicio ? `${horaInicio}` : '10:00';
  const horasTexto = duracionHoras === 1 ? '1 hora' : `${duracionHoras} horas`;

  const esDebe = estado === 'debe' || estado === 'pendiente';

  if (esDebe) {
    return `🎓 *Clases Particulares UTN*
----------------------------------------
¡Hola *${soloNombre}*! 👋

Confirmamos tu reserva para la clase particular:

📅 *Fecha:*
${fechaFormateada} ${horaStr} (${horasTexto})

----------------------------------------
💳 *LINK DE PAGO:*
clasesparticularesutn.com.ar/pagos

¿No sabes como pagar?
clasesparticularesutn.com.ar/tutoriales
----------------------------------------

¡Nos vemos en clase! 💻🚀`;
  }

  return `🎓 *Clases Particulares UTN*
----------------------------------------
¡Hola *${soloNombre}*! 👋

Confirmamos tu reserva para la clase particular:

📅 *Fecha:*
${fechaFormateada} ${horaStr} (${horasTexto})

¡Nos vemos en clase! 💻🚀`;
}

export function limpiarTelefonoParaWhatsApp(telefono?: string | null): string {
  if (!telefono) return '';
  let clean = telefono.replace(/\D/g, '');
  if (!clean) return '';

  // Quitar ceros al inicio (ej: 0342 -> 342)
  while (clean.startsWith('0')) {
    clean = clean.slice(1);
  }

  // Si ya tiene el prefijo internacional de Argentina completo (549)
  if (clean.startsWith('549')) {
    return clean;
  }

  // Si empieza con 54 pero sin el 9 de móvil (ej: 543425123456)
  if (clean.startsWith('54')) {
    clean = clean.slice(2);
    while (clean.startsWith('0')) clean = clean.slice(1);
    if (clean.length === 12 && clean.includes('15')) {
      clean = clean.replace(/(\d{2,4})15(\d{6,8})/, '$1$2');
    }
    return `549${clean}`;
  }

  // Quitar el '15' si fue ingresado en formato local (ej: 342155123456 -> 3425123456)
  if (clean.length === 12 && clean.includes('15')) {
    clean = clean.replace(/(\d{2,4})15(\d{6,8})/, '$1$2');
  }

  // Si tiene al menos 8 dígitos, agregar prefijo 549 de Argentina
  if (clean.length >= 8) {
    return `549${clean}`;
  }

  return clean;
}

export function getWhatsAppUrl(telefono?: string | null, mensaje?: string): string {
  const clean = limpiarTelefonoParaWhatsApp(telefono);
  const encoded = encodeURIComponent(mensaje || '');
  if (clean) {
    return `https://wa.me/${clean}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export function getWhatsAppWebUrl(telefono?: string | null, mensaje?: string): string {
  const clean = limpiarTelefonoParaWhatsApp(telefono);
  const encoded = encodeURIComponent(mensaje || '');
  if (clean) {
    return `https://web.whatsapp.com/send?phone=${clean}&text=${encoded}`;
  }
  return `https://web.whatsapp.com/send?text=${encoded}`;
}
