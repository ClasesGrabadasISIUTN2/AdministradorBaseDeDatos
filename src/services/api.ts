import { Alumno, Reserva, DashboardStats, DatabaseStatus } from '../types';

export const api = {
  // Stats
  async getStats(): Promise<DashboardStats> {
    const res = await fetch('/api/admin/stats');
    if (!res.ok) throw new Error('Error al cargar estadísticas');
    return res.json();
  },

  // Alumnos
  async getAlumnos(): Promise<Alumno[]> {
    const res = await fetch('/api/admin/alumnos');
    if (!res.ok) throw new Error('Error al cargar alumnos');
    return res.json();
  },

  async getAlumno(id: number): Promise<{ alumno: Alumno; reservas: Reserva[] }> {
    const res = await fetch(`/api/admin/alumnos/${id}`);
    if (!res.ok) throw new Error('Error al cargar alumno');
    return res.json();
  },

  async createAlumno(data: Partial<Alumno>): Promise<{ ok: boolean; alumno: Alumno }> {
    const res = await fetch('/api/admin/alumnos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al crear alumno');
    return res.json();
  },

  async updateAlumno(id: number, data: Partial<Alumno>): Promise<{ ok: boolean; alumno: Alumno }> {
    const res = await fetch(`/api/admin/alumnos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al actualizar alumno');
    return res.json();
  },

  async deleteAlumno(id: number): Promise<{ ok: boolean }> {
    const res = await fetch(`/api/admin/alumnos/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error al eliminar alumno');
    return res.json();
  },

  async cambiarClave(id: number, contrasenia: string): Promise<{ ok: boolean }> {
    const res = await fetch(`/api/admin/alumnos/${id}/cambiar-clave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contrasenia }),
    });
    if (!res.ok) throw new Error('Error al cambiar contraseña');
    return res.json();
  },

  async ajustarHoras(id: number, horas: number, pack?: number, fecha_pago?: string): Promise<{ ok: boolean; alumno: Alumno }> {
    const res = await fetch(`/api/admin/alumnos/${id}/ajustar-horas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ horas, pack, fecha_pago }),
    });
    if (!res.ok) throw new Error('Error al ajustar horas');
    return res.json();
  },

  // Reservas
  async getReservas(): Promise<Reserva[]> {
    const res = await fetch('/api/admin/reservas');
    if (!res.ok) throw new Error('Error al cargar reservas');
    return res.json();
  },

  async createReserva(data: any): Promise<{ ok: boolean; reserva: Reserva }> {
    const res = await fetch('/api/admin/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al crear reserva');
    return res.json();
  },

  async updateReserva(id: number, data: Partial<Reserva>): Promise<{ ok: boolean; reserva: Reserva }> {
    const res = await fetch(`/api/admin/reservas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al actualizar reserva');
    return res.json();
  },

  async deleteReserva(id: number): Promise<{ ok: boolean }> {
    const res = await fetch(`/api/admin/reservas/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error al eliminar reserva');
    return res.json();
  },

  async cancelarReserva(id: number, porcentajeCobro: number): Promise<{ ok: boolean; reserva: Reserva }> {
    const res = await fetch(`/api/admin/reservas/${id}/cancelar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ porcentajeCobro }),
    });
    if (!res.ok) throw new Error('Error al cancelar reserva');
    return res.json();
  },

  // Clases Pendientes
  async getClasesPendientes(): Promise<Reserva[]> {
    const res = await fetch('/api/admin/clases-pendientes');
    if (!res.ok) throw new Error('Error al cargar clases pendientes');
    return res.json();
  },

  // Pagos
  async getPagos(): Promise<{ deudasPorAlumno: any[]; pagosRecientes: Reserva[] }> {
    const res = await fetch('/api/admin/pagos');
    if (!res.ok) throw new Error('Error al cargar información de pagos');
    return res.json();
  },

  async registrarPago(reservaIds: number[], alumnoId?: number, monto?: number): Promise<{ ok: boolean; mensaje: string }> {
    const res = await fetch('/api/admin/pagos/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservaIds, alumnoId, monto }),
    });
    if (!res.ok) throw new Error('Error al registrar pago');
    return res.json();
  },

  async habilitarPack(alumnoId: number, tipoPack: string, horasCustom?: number): Promise<{ ok: boolean; alumno: Alumno }> {
    const res = await fetch('/api/admin/pagos/habilitar-pack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alumnoId, tipoPack, horasCustom }),
    });
    if (!res.ok) throw new Error('Error al habilitar pack');
    return res.json();
  },

  // Base de Datos Status
  async getDbStatus(): Promise<DatabaseStatus> {
    const res = await fetch('/api/admin/db-status');
    if (!res.ok) throw new Error('Error al consultar estado de la base de datos');
    return res.json();
  },

  // SQL Runner
  async runSqlQuery(query: string): Promise<any> {
    const res = await fetch('/api/admin/sql-runner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error ejecutando consulta');
    }
    return res.json();
  },
};
