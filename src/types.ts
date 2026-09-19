export interface Alumno {
  id: number;
  nombre: string;
  apellido: string | null;
  correo: string;
  password_hash?: string | null;
  telefono: string | null;
  anio_ingreso: number | null;
  materia: string | null;
  estado_materia: string | null;
  comentario: string | null;
  horas_a_favor: number;
  fecha_pago: string | null;
  dinero_debe: number;
  pack: number | null;
  condicion_pago: string | null;
  ultima_conexion?: string | null;
  created_at: string;
  contrasenas_intentadas?: string[];
  // Computed fields
  deudaTotal?: number;
  deudaFutura?: number;
  reservasCount?: number;
}

export interface Reserva {
  id: number;
  alumno_id: number;
  fecha_realizado: string | null;
  fecha_reservada_texto: string | null;
  estado: 'pack' | 'debe' | 'cancelada' | 'pagada' | string;
  celdas: string[] | any;
  tipo_clase: string | null;
  codigo: string | null;
  precio: number;
  indice_hoja: number | null;
  created_at: string;
  // Joined student data
  alumno_nombre?: string;
  alumno_apellido?: string;
  alumno_correo?: string;
  alumno_telefono?: string;
  integrantes?: string[];
  horas?: number;
  horaInicio?: string;
  recargoMora?: number;
  totalConMora?: number;
}

export interface ReservaIntegrante {
  id: number;
  reserva_id: number;
  email: string;
}

export interface DashboardStats {
  totalAlumnos: number;
  alumnosConDeuda: number;
  totalReservas: number;
  clasesPendientes: number;
  clasesHoy: number;
  totalDeudaCalculada: number;
  totalRecaudado: number;
  totalHorasPackActivas: number;
}

export interface DatabaseStatus {
  connected: boolean;
  mode: 'postgres' | 'local_fallback';
  databaseUrlSet: boolean;
  latencyMs?: number;
  tableCounts?: {
    alumnos: number;
    reservas: number;
    reserva_integrantes: number;
  };
  error?: string;
}
