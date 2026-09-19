import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import pg from 'pg';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const { Pool } = pg;
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb', type: () => true }));

// Configuration
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'clasesparticularesutnfrsf@gmail.com')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const MASTER_PASSWORD = process.env.MASTER_PASSWORD || '';
const PASSWORD_MIN_LENGTH = 4;

const LETRAS_DIAS = ['B', 'C', 'D', 'E', 'F', 'G', 'H'];
const NOMBRES_DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const ALFABETO_CODIGO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const MESES_EN: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

// Database Connection
let pool: pg.Pool | null = null;
let isPostgresActive = false;

// Inicializa las tablas en PostgreSQL si aún no existen
async function inicializarTablasPostgres(pgPool: pg.Pool) {
  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS alumnos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        apellido VARCHAR(255),
        correo VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        telefono VARCHAR(100),
        anio_ingreso INTEGER,
        materia VARCHAR(255),
        estado_materia VARCHAR(100),
        comentario TEXT,
        contrasenas_intentadas JSONB DEFAULT '[]'::jsonb,
        horas_a_favor NUMERIC DEFAULT 0,
        fecha_pago DATE,
        dinero_debe NUMERIC DEFAULT 0,
        pack NUMERIC DEFAULT 0,
        condicion_pago VARCHAR(100) DEFAULT 'Normal',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reservas (
        id SERIAL PRIMARY KEY,
        alumno_id INTEGER REFERENCES alumnos(id) ON DELETE CASCADE,
        fecha_realizado DATE,
        fecha_reservada_texto VARCHAR(255),
        estado VARCHAR(50) DEFAULT 'debe',
        celdas JSONB DEFAULT '[]'::jsonb,
        tipo_clase VARCHAR(100) DEFAULT 'estandar_individual',
        precio NUMERIC DEFAULT 0,
        indice_hoja INTEGER DEFAULT 0,
        codigo VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reserva_integrantes (
        id SERIAL PRIMARY KEY,
        reserva_id INTEGER REFERENCES reservas(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL
      );
    `);
    console.log('✅ Esquema verificado en PostgreSQL (tablas listas y limpias)');
  } catch (err: any) {
    console.error('⚠️ Error al verificar/crear esquema en PostgreSQL:', err.message);
  }
}

if (process.env.DATABASE_URL) {
  try {
    const isLocal = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    // Test initial connection asynchronously
    pool.query('SELECT NOW()')
      .then(async () => {
        isPostgresActive = true;
        console.log('✅ Conexión a PostgreSQL establecida correctamente');
        if (pool) {
          await inicializarTablasPostgres(pool);
        }
      })
      .catch((err) => {
        console.warn('⚠️ No se pudo conectar a PostgreSQL con DATABASE_URL. Activando almacén en memoria:', err.message);
        isPostgresActive = false;
      });
  } catch (err: any) {
    console.warn('⚠️ Error configurando Pool de PostgreSQL:', err.message);
  }
} else {
  console.log('ℹ️ DATABASE_URL no configurada. Operando en modo almacén en memoria para vista previa.');
}

// ─── ALMACÉN EN MEMORIA (FALLBACK / MOCK STORE) ─────────────────────────────
// Si no hay DATABASE_URL configurada todavía en el entorno, el servidor
// opera con este almacén en memoria inicializado con datos representativos de
// UTN FRSF, permitiendo administrar alumnos, reservas, pagos y clases pendientes.
interface LocalAlumno {
  id: number;
  nombre: string;
  apellido: string | null;
  correo: string;
  password_hash: string | null;
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
  created_at: string;
  contrasenas_intentadas: string[];
}

interface LocalReserva {
  id: number;
  alumno_id: number;
  fecha_realizado: string | null;
  fecha_reservada_texto: string | null;
  estado: string;
  celdas: string[];
  tipo_clase: string | null;
  codigo: string | null;
  precio: number;
  indice_hoja: number | null;
  created_at: string;
}

interface LocalReservaIntegrante {
  id: number;
  reserva_id: number;
  email: string;
}

// Generar fechas relativas para el mock store
const hoy = new Date();
const formatIso = (d: Date) => d.toISOString().slice(0, 10);
const offsetDays = (days: number) => {
  const d = new Date(hoy);
  d.setDate(d.getDate() + days);
  return formatIso(d);
};

let localAlumnos: LocalAlumno[] = [
  {
    id: 1,
    nombre: 'Martín',
    apellido: 'González',
    correo: 'mgonzalez@frsf.utn.edu.ar',
    password_hash: 'utn2026',
    telefono: '+5493425123456',
    anio_ingreso: 2023,
    materia: 'Análisis Matemático I',
    estado_materia: 'Cursando',
    comentario: 'Necesita reforzar integrales dobles y derivadas parciales.',
    horas_a_favor: 6,
    fecha_pago: offsetDays(-15),
    dinero_debe: 0,
    pack: 20,
    condicion_pago: 'Normal',
    created_at: offsetDays(-60),
    contrasenas_intentadas: [],
  },
  {
    id: 2,
    nombre: 'Valentina',
    apellido: 'Rossi',
    correo: 'vrossi@gmail.com',
    password_hash: 'valen2026',
    telefono: '+5493424876543',
    anio_ingreso: 2022,
    materia: 'Álgebra y Geometría Analítica',
    estado_materia: 'Regular',
    comentario: 'Preparando examen final para llamado de Diciembre.',
    horas_a_favor: 0,
    fecha_pago: offsetDays(-40),
    dinero_debe: 16000,
    pack: 0,
    condicion_pago: 'Mora',
    created_at: offsetDays(-45),
    contrasenas_intentadas: [],
  },
  {
    id: 3,
    nombre: 'Lucas',
    apellido: 'Benítez',
    correo: 'lucas.benitez@outlook.com',
    password_hash: 'lucas123',
    telefono: '+5493426112233',
    anio_ingreso: 2024,
    materia: 'Física I',
    estado_materia: 'Recursando',
    comentario: 'Grupo de estudio para TP de Dinámica.',
    horas_a_favor: 12,
    fecha_pago: offsetDays(-5),
    dinero_debe: 0,
    pack: 40,
    condicion_pago: 'Normal',
    created_at: offsetDays(-30),
    contrasenas_intentadas: [],
  },
  {
    id: 4,
    nombre: 'Camila',
    apellido: 'Pérez',
    correo: 'camila.perez@gmail.com',
    password_hash: 'camiutn',
    telefono: '+5493425998877',
    anio_ingreso: 2023,
    materia: 'Química General',
    estado_materia: 'Libre',
    comentario: 'Clases individuales semanales.',
    horas_a_favor: 0,
    fecha_pago: offsetDays(-20),
    dinero_debe: 8000,
    pack: 0,
    condicion_pago: 'Normal',
    created_at: offsetDays(-25),
    contrasenas_intentadas: [],
  },
  {
    id: 5,
    nombre: 'Joaquín',
    apellido: 'Mansilla',
    correo: 'jmansilla@frsf.utn.edu.ar',
    password_hash: 'joaco99',
    telefono: '+5493424334455',
    anio_ingreso: 2021,
    materia: 'Análisis Matemático II',
    estado_materia: 'Regular',
    comentario: 'Consulta previa a parcial integrador.',
    horas_a_favor: 2,
    fecha_pago: offsetDays(-10),
    dinero_debe: 0,
    pack: 20,
    condicion_pago: 'Normal',
    created_at: offsetDays(-90),
    contrasenas_intentadas: [],
  },
  {
    id: 6,
    nombre: 'Admin',
    apellido: 'UTN FRSF',
    correo: 'clasesparticularesutnfrsf@gmail.com',
    password_hash: 'admin2026',
    telefono: '+5493425000000',
    anio_ingreso: 2020,
    materia: 'Coordinación',
    estado_materia: 'Admin',
    comentario: 'Cuenta administradora del sistema.',
    horas_a_favor: 100,
    fecha_pago: offsetDays(-1),
    dinero_debe: 0,
    pack: 100,
    condicion_pago: 'Normal',
    created_at: offsetDays(-365),
    contrasenas_intentadas: [],
  }
];

let localReservas: LocalReserva[] = [
  {
    id: 101,
    alumno_id: 1,
    fecha_realizado: offsetDays(1),
    fecha_reservada_texto: 'Lunes 10:00 (2 horas)',
    estado: 'pack',
    celdas: ['B5', 'B6'],
    tipo_clase: 'estandar_individual',
    codigo: 'ResAM1-01',
    precio: 0,
    indice_hoja: 0,
    created_at: offsetDays(-1),
  },
  {
    id: 102,
    alumno_id: 1,
    fecha_realizado: offsetDays(3),
    fecha_reservada_texto: 'Miércoles 14:00 (2 horas)',
    estado: 'pack',
    celdas: ['D9', 'D10'],
    tipo_clase: 'estandar_individual',
    codigo: 'ResAM1-02',
    precio: 0,
    indice_hoja: 0,
    created_at: offsetDays(-1),
  },
  {
    id: 103,
    alumno_id: 2,
    fecha_realizado: offsetDays(-3),
    fecha_reservada_texto: 'Jueves 16:00 (2 horas)',
    estado: 'debe',
    celdas: ['E11', 'E12'],
    tipo_clase: 'estandar_individual',
    codigo: 'ResAGA-01',
    precio: 8000,
    indice_hoja: -1,
    created_at: offsetDays(-5),
  },
  {
    id: 104,
    alumno_id: 2,
    fecha_realizado: offsetDays(2),
    fecha_reservada_texto: 'Martes 16:00 (2 horas)',
    estado: 'debe',
    celdas: ['C11', 'C12'],
    tipo_clase: 'estandar_individual',
    codigo: 'ResAGA-02',
    precio: 8000,
    indice_hoja: 0,
    created_at: offsetDays(-2),
  },
  {
    id: 105,
    alumno_id: 3,
    fecha_realizado: offsetDays(1),
    fecha_reservada_texto: 'Lunes 18:00 (2 horas)',
    estado: 'pack',
    celdas: ['B13', 'B14'],
    tipo_clase: 'tp_grupal',
    codigo: 'ResFIS-GRP',
    precio: 0,
    indice_hoja: 0,
    created_at: offsetDays(-2),
  },
  {
    id: 106,
    alumno_id: 4,
    fecha_realizado: offsetDays(-7),
    fecha_reservada_texto: 'Viernes 08:15 (2 horas)',
    estado: 'debe',
    celdas: ['F3', 'F4'],
    tipo_clase: 'consulta_individual',
    codigo: 'ResQMC-01',
    precio: 8000,
    indice_hoja: -1,
    created_at: offsetDays(-9),
  },
  {
    id: 107,
    alumno_id: 5,
    fecha_realizado: offsetDays(-10),
    fecha_reservada_texto: 'Martes 10:00 (2 horas)',
    estado: 'pagada',
    celdas: ['C5', 'C6'],
    tipo_clase: 'estandar_individual',
    codigo: 'ResAM2-PAG',
    precio: 8000,
    indice_hoja: -2,
    created_at: offsetDays(-14),
  },
  {
    id: 108,
    alumno_id: 4,
    fecha_realizado: offsetDays(-4),
    fecha_reservada_texto: 'Miércoles 11:00 (1 hora)',
    estado: 'cancelada',
    celdas: ['D6'],
    tipo_clase: 'estandar_individual',
    codigo: 'ResQMC-CNC',
    precio: 2000,
    indice_hoja: -1,
    created_at: offsetDays(-5),
  },
  {
    id: 109,
    alumno_id: 3,
    fecha_realizado: offsetDays(4),
    fecha_reservada_texto: 'Jueves 10:00 (2 horas)',
    estado: 'pack',
    celdas: ['E5', 'E6'],
    tipo_clase: 'estandar_individual',
    codigo: 'ResFIS-02',
    precio: 0,
    indice_hoja: 0,
    created_at: offsetDays(-1),
  }
];

let localReservaIntegrantes: LocalReservaIntegrante[] = [
  { id: 1, reserva_id: 105, email: 'lucas.benitez@outlook.com' },
  { id: 2, reserva_id: 105, email: 'mgonzalez@frsf.utn.edu.ar' },
];

let nextAlumnoId = 7;
let nextReservaId = 110;
let nextIntegranteId = 3;

// Helper de fechas y horas
function normalizarFechaPago(fechaPago: any): string | null {
  if (!fechaPago) return null;
  if (fechaPago instanceof Date) {
    return isNaN(fechaPago.getTime()) ? null : fechaPago.toISOString().slice(0, 10);
  }
  const texto = String(fechaPago).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return texto.slice(0, 10);
  if (texto === '' || texto.toUpperCase() === 'NULL' || texto === '0') return null;
  const m = texto.match(/^\w{3} (\w{3}) (\d{2}) (\d{4})/);
  if (m && MESES_EN[m[1]]) return `${m[3]}-${MESES_EN[m[1]]}-${m[2]}`;
  return null;
}

function parsearCelda(celda: string) {
  const letra = String(celda).charAt(0).toUpperCase();
  const numero = parseInt(String(celda).slice(1), 10);
  const diaIndex = LETRAS_DIAS.indexOf(letra);
  const hora = numero + 5;
  return { diaIndex, hora };
}

function formatearHora(hora: number | null | undefined): string | null {
  if (hora === null || hora === undefined) return null;
  return hora === 8 ? '8:15' : `${hora}:00`;
}

function primeraHoraDesdeCeldas(celdas: any[]): number | null {
  let minHora: number | null = null;
  for (const celda of celdas || []) {
    const { hora } = parsearCelda(celda);
    if (minHora === null || hora < minHora) minHora = hora;
  }
  return minHora;
}

function lunesDeLaSemana(numeroHoja: number) {
  const h = new Date();
  h.setHours(0, 0, 0, 0);
  const dia = h.getDay();
  const diffLunes = dia === 0 ? -6 : 1 - dia;
  const lunes = new Date(h);
  lunes.setDate(h.getDate() + diffLunes + (Number(numeroHoja) || 0) * 7);
  return lunes;
}

function generarCodigoReserva(longitud = 10) {
  let codigo = '';
  for (let i = 0; i < longitud; i++) {
    codigo += ALFABETO_CODIGO[Math.floor(Math.random() * ALFABETO_CODIGO.length)];
  }
  return codigo;
}

function calcularMora(fechaDeuda: Date | null, precio: number, ahora: Date): number {
  if (!fechaDeuda || fechaDeuda >= ahora || precio <= 0) return 0;
  const diffMs = ahora.getTime() - fechaDeuda.getTime();
  const diasTotales = diffMs / (1000 * 60 * 60 * 24);
  let recargo = 0;
  if (diasTotales < 1) {
    recargo = 0;
  } else if (diasTotales >= 1 && diasTotales < 2) {
    recargo = precio * 0.05;
  } else if (diasTotales >= 2) {
    const montoBase = precio * 1.05;
    const diasExtra = Math.ceil(diasTotales - 2);
    const montoFinal = montoBase * Math.pow(1.01, diasExtra);
    recargo = montoFinal - precio;
  }
  return Math.round(Math.min(recargo, 10000));
}

// ─── ADAPTADOR DE BASE DE DATOS UNIFICADO ───────────────────────────────────
// Permite leer y escribir ya sea en Postgres o en el Almacén en Memoria sin
// duplicar lógica de negocio.
const db = {
  isPostgres() {
    return isPostgresActive && pool !== null;
  },

  async getAlumnos() {
    if (this.isPostgres()) {
      const res = await pool!.query('SELECT * FROM alumnos ORDER BY nombre ASC, id ASC');
      return res.rows;
    }
    return [...localAlumnos];
  },

  async getAlumnoById(id: number) {
    if (this.isPostgres()) {
      const res = await pool!.query('SELECT * FROM alumnos WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    return localAlumnos.find((a) => a.id === id) || null;
  },

  async getAlumnoByCorreo(correo: string) {
    const norm = (correo || '').trim().toLowerCase();
    if (this.isPostgres()) {
      const res = await pool!.query('SELECT * FROM alumnos WHERE LOWER(correo) = $1', [norm]);
      return res.rows[0] || null;
    }
    return localAlumnos.find((a) => a.correo.toLowerCase() === norm) || null;
  },

  async createAlumno(data: any) {
    if (this.isPostgres()) {
      const res = await pool!.query(
        `INSERT INTO alumnos
          (nombre, apellido, correo, password_hash, telefono, anio_ingreso,
           materia, estado_materia, comentario, contrasenas_intentadas, horas_a_favor, pack, condicion_pago)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING *`,
        [
          data.nombre,
          data.apellido || null,
          data.correo.toLowerCase().trim(),
          data.password_hash || '1234',
          data.telefono || null,
          data.anio_ingreso ? parseInt(data.anio_ingreso, 10) : null,
          data.materia || null,
          data.estado_materia || null,
          data.comentario || null,
          JSON.stringify(data.contrasenas_intentadas || []),
          data.horas_a_favor || 0,
          data.pack || 0,
          data.condicion_pago || 'Normal',
        ]
      );
      return res.rows[0];
    }
    const nuevo: LocalAlumno = {
      id: nextAlumnoId++,
      nombre: data.nombre,
      apellido: data.apellido || null,
      correo: data.correo.toLowerCase().trim(),
      password_hash: data.password_hash || '1234',
      telefono: data.telefono || null,
      anio_ingreso: data.anio_ingreso ? parseInt(data.anio_ingreso, 10) : null,
      materia: data.materia || null,
      estado_materia: data.estado_materia || null,
      comentario: data.comentario || null,
      horas_a_favor: Number(data.horas_a_favor) || 0,
      fecha_pago: data.fecha_pago || null,
      dinero_debe: Number(data.dinero_debe) || 0,
      pack: Number(data.pack) || 0,
      condicion_pago: data.condicion_pago || 'Normal',
      created_at: new Date().toISOString(),
      contrasenas_intentadas: [],
    };
    localAlumnos.push(nuevo);
    return nuevo;
  },

  async updateAlumno(id: number, data: any) {
    if (this.isPostgres()) {
      const res = await pool!.query(
        `UPDATE alumnos
            SET nombre = COALESCE($1, nombre),
                apellido = COALESCE($2, apellido),
                correo = COALESCE($3, correo),
                telefono = COALESCE($4, telefono),
                anio_ingreso = COALESCE($5, anio_ingreso),
                materia = COALESCE($6, materia),
                estado_materia = COALESCE($7, estado_materia),
                comentario = COALESCE($8, comentario),
                horas_a_favor = COALESCE($9, horas_a_favor),
                pack = COALESCE($10, pack),
                condicion_pago = COALESCE($11, condicion_pago),
                dinero_debe = COALESCE($12, dinero_debe),
                fecha_pago = COALESCE($13, fecha_pago)
          WHERE id = $14
          RETURNING *`,
        [
          data.nombre,
          data.apellido,
          data.correo ? data.correo.toLowerCase().trim() : null,
          data.telefono,
          data.anio_ingreso !== undefined ? data.anio_ingreso : null,
          data.materia,
          data.estado_materia,
          data.comentario,
          data.horas_a_favor !== undefined ? data.horas_a_favor : null,
          data.pack !== undefined ? data.pack : null,
          data.condicion_pago,
          data.dinero_debe !== undefined ? data.dinero_debe : null,
          data.fecha_pago !== undefined ? data.fecha_pago : null,
          id,
        ]
      );
      return res.rows[0];
    }
    const idx = localAlumnos.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    localAlumnos[idx] = {
      ...localAlumnos[idx],
      ...data,
      correo: data.correo ? data.correo.toLowerCase().trim() : localAlumnos[idx].correo,
    };
    return localAlumnos[idx];
  },

  async deleteAlumno(id: number) {
    if (this.isPostgres()) {
      await pool!.query('DELETE FROM reserva_integrantes WHERE reserva_id IN (SELECT id FROM reservas WHERE alumno_id = $1)', [id]);
      await pool!.query('DELETE FROM reservas WHERE alumno_id = $1', [id]);
      await pool!.query('DELETE FROM alumnos WHERE id = $1', [id]);
      return true;
    }
    localReservas = localReservas.filter((r) => r.alumno_id !== id);
    localAlumnos = localAlumnos.filter((a) => a.id !== id);
    return true;
  },

  async getReservas() {
    if (this.isPostgres()) {
      const res = await pool!.query(`
        SELECT r.*,
               a.nombre as alumno_nombre,
               a.apellido as alumno_apellido,
               a.correo as alumno_correo,
               a.telefono as alumno_telefono
          FROM reservas r
          LEFT JOIN alumnos a ON a.id = r.alumno_id
         ORDER BY r.fecha_realizado DESC NULLS LAST, r.id DESC
      `);
      return res.rows;
    }
    return localReservas.map((r) => {
      const al = localAlumnos.find((a) => a.id === r.alumno_id);
      return {
        ...r,
        alumno_nombre: al?.nombre,
        alumno_apellido: al?.apellido,
        alumno_correo: al?.correo,
        alumno_telefono: al?.telefono,
      };
    });
  },

  async getReservasByAlumnoId(alumnoId: number) {
    if (this.isPostgres()) {
      const res = await pool!.query('SELECT * FROM reservas WHERE alumno_id = $1 ORDER BY fecha_realizado ASC', [alumnoId]);
      return res.rows;
    }
    return localReservas.filter((r) => r.alumno_id === alumnoId);
  },

  async createReserva(data: any) {
    if (this.isPostgres()) {
      const res = await pool!.query(
        `INSERT INTO reservas
          (alumno_id, fecha_realizado, fecha_reservada_texto, estado, celdas, tipo_clase, precio, indice_hoja, codigo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [
          data.alumno_id,
          data.fecha_realizado,
          data.fecha_reservada_texto,
          data.estado || 'debe',
          JSON.stringify(data.celdas || []),
          data.tipo_clase || 'estandar_individual',
          data.precio || 0,
          data.indice_hoja || 0,
          data.codigo || generarCodigoReserva(),
        ]
      );
      return res.rows[0];
    }
    const nueva: LocalReserva = {
      id: nextReservaId++,
      alumno_id: Number(data.alumno_id),
      fecha_realizado: data.fecha_realizado || null,
      fecha_reservada_texto: data.fecha_reservada_texto || null,
      estado: data.estado || 'debe',
      celdas: Array.isArray(data.celdas) ? data.celdas : [],
      tipo_clase: data.tipo_clase || 'estandar_individual',
      codigo: data.codigo || generarCodigoReserva(),
      precio: Number(data.precio) || 0,
      indice_hoja: Number(data.indice_hoja) || 0,
      created_at: new Date().toISOString(),
    };
    localReservas.unshift(nueva);
    return nueva;
  },

  async updateReserva(id: number, data: any) {
    if (this.isPostgres()) {
      const res = await pool!.query(
        `UPDATE reservas
            SET estado = COALESCE($1, estado),
                precio = COALESCE($2, precio),
                fecha_realizado = COALESCE($3, fecha_realizado),
                fecha_reservada_texto = COALESCE($4, fecha_reservada_texto),
                tipo_clase = COALESCE($5, tipo_clase),
                celdas = COALESCE($6, celdas)
          WHERE id = $7
          RETURNING *`,
        [
          data.estado,
          data.precio !== undefined ? data.precio : null,
          data.fecha_realizado,
          data.fecha_reservada_texto,
          data.tipo_clase,
          data.celdas ? JSON.stringify(data.celdas) : null,
          id,
        ]
      );
      return res.rows[0];
    }
    const idx = localReservas.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    localReservas[idx] = { ...localReservas[idx], ...data };
    return localReservas[idx];
  },

  async deleteReserva(id: number) {
    if (this.isPostgres()) {
      await pool!.query('DELETE FROM reserva_integrantes WHERE reserva_id = $1', [id]);
      await pool!.query('DELETE FROM reservas WHERE id = $1', [id]);
      return true;
    }
    localReservaIntegrantes = localReservaIntegrantes.filter((i) => i.reserva_id !== id);
    localReservas = localReservas.filter((r) => r.id !== id);
    return true;
  },

  async getIntegrantes(reservaId: number) {
    if (this.isPostgres()) {
      const res = await pool!.query('SELECT * FROM reserva_integrantes WHERE reserva_id = $1', [reservaId]);
      return res.rows;
    }
    return localReservaIntegrantes.filter((i) => i.reserva_id === reservaId);
  },

  async addIntegrante(reservaId: number, email: string) {
    if (this.isPostgres()) {
      await pool!.query('INSERT INTO reserva_integrantes (reserva_id, email) VALUES ($1,$2)', [reservaId, email.toLowerCase().trim()]);
      return;
    }
    localReservaIntegrantes.push({ id: nextIntegranteId++, reserva_id: reservaId, email: email.toLowerCase().trim() });
  }
};

// ─── RUTAS DE ADMINISTRACIÓN REST (/api/admin/...) ──────────────────────────

// 1. Estadísticas Generales del Panel
app.get('/api/admin/stats', async (req: Request, res: Response) => {
  try {
    const alumnos = await db.getAlumnos();
    const reservas = await db.getReservas();
    const ahora = new Date();
    ahora.setHours(0, 0, 0, 0);

    let totalDeuda = 0;
    let totalRecaudado = 0;
    let alumnosConDeuda = 0;
    let clasesPendientes = 0;
    let clasesHoy = 0;
    let totalHorasPack = 0;

    alumnos.forEach((a: any) => {
      totalHorasPack += Number(a.horas_a_favor || 0);
      const resAl = reservas.filter((r: any) => r.alumno_id === a.id);
      let deudaAl = 0;
      resAl.forEach((r: any) => {
        if ((r.estado === 'debe' || r.estado === 'cancelada') && Number(r.precio) > 0) {
          deudaAl += Number(r.precio);
          const fechaClase = r.fecha_realizado ? new Date(r.fecha_realizado) : null;
          deudaAl += calcularMora(fechaClase, Number(r.precio), new Date());
        }
      });
      if (deudaAl > 0) {
        alumnosConDeuda++;
        totalDeuda += deudaAl;
      }
    });

    reservas.forEach((r: any) => {
      if (r.estado === 'pagada') {
        totalRecaudado += Number(r.precio || 0);
      }
      if (r.fecha_realizado) {
        const fecha = new Date(r.fecha_realizado);
        fecha.setHours(0, 0, 0, 0);
        if (fecha >= ahora && r.estado !== 'cancelada') {
          clasesPendientes++;
        }
        if (fecha.getTime() === ahora.getTime() && r.estado !== 'cancelada') {
          clasesHoy++;
        }
      }
    });

    res.json({
      totalAlumnos: alumnos.length,
      alumnosConDeuda,
      totalReservas: reservas.length,
      clasesPendientes,
      clasesHoy,
      totalDeudaCalculada: totalDeuda,
      totalRecaudado,
      totalHorasPackActivas: totalHorasPack,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Alumnos
app.get('/api/admin/alumnos', async (req: Request, res: Response) => {
  try {
    const alumnos = await db.getAlumnos();
    const reservas = await db.getReservas();
    const ahora = new Date();

    const enriquecidos = alumnos.map((a: any) => {
      const reservasAl = reservas.filter((r: any) => r.alumno_id === a.id);
      let deudaTotal = 0;
      let deudaFutura = 0;

      reservasAl.forEach((r: any) => {
        const precio = Number(r.precio || 0);
        const fechaClase = r.fecha_realizado ? new Date(r.fecha_realizado) : null;
        if ((r.estado === 'debe' || r.estado === 'cancelada') && precio > 0) {
          const mora = calcularMora(fechaClase, precio, ahora);
          deudaTotal += precio + mora;
          if (fechaClase && fechaClase > ahora) {
            deudaFutura += precio;
          }
        }
      });

      return {
        ...a,
        deudaTotal,
        deudaFutura,
        reservasCount: reservasAl.length,
      };
    });

    res.json(enriquecidos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/alumnos', async (req: Request, res: Response) => {
  try {
    const nuevo = await db.createAlumno(req.body);
    res.json({ ok: true, alumno: nuevo });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/admin/alumnos/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const alumno = await db.getAlumnoById(id);
    if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado' });
    const reservas = await db.getReservasByAlumnoId(id);
    res.json({ alumno, reservas });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/alumnos/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const actualizado = await db.updateAlumno(id, req.body);
    res.json({ ok: true, alumno: actualizado });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete('/api/admin/alumnos/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.deleteAlumno(id);
    res.json({ ok: true, mensaje: 'Alumno eliminado con éxito' });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/admin/alumnos/:id/ajustar-horas', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { horas, pack, fecha_pago } = req.body;
    const actualizado = await db.updateAlumno(id, {
      horas_a_favor: horas !== undefined ? Number(horas) : undefined,
      pack: pack !== undefined ? Number(pack) : undefined,
      fecha_pago: fecha_pago || undefined,
    });
    res.json({ ok: true, alumno: actualizado });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/admin/alumnos/:id/cambiar-clave', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { contrasenia } = req.body;
    if (!contrasenia || contrasenia.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({ ok: false, error: 'Contraseña demasiado corta' });
    }
    const actualizado = await db.updateAlumno(id, { password_hash: contrasenia });
    res.json({ ok: true, alumno: actualizado });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 3. Reservas
app.get('/api/admin/reservas', async (req: Request, res: Response) => {
  try {
    const reservas = await db.getReservas();
    const ahora = new Date();

    const enriquecidas = await Promise.all(
      reservas.map(async (r: any) => {
        const celdas = Array.isArray(r.celdas) ? r.celdas : (typeof r.celdas === 'string' ? JSON.parse(r.celdas || '[]') : []);
        const horaInicio = primeraHoraDesdeCeldas(celdas);
        const fechaClase = r.fecha_realizado ? new Date(r.fecha_realizado) : null;
        const precio = Number(r.precio || 0);
        const mora = (r.estado === 'debe' || r.estado === 'cancelada') ? calcularMora(fechaClase, precio, ahora) : 0;
        const integrantes = await db.getIntegrantes(r.id);

        return {
          ...r,
          celdas,
          horas: celdas.length,
          horaInicio: formatearHora(horaInicio),
          recargoMora: mora,
          totalConMora: precio + mora,
          integrantes: integrantes.map((i: any) => i.email),
        };
      })
    );

    res.json(enriquecidas);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/reservas', async (req: Request, res: Response) => {
  try {
    const nueva = await db.createReserva(req.body);
    if (Array.isArray(req.body.integrantes)) {
      for (const email of req.body.integrantes) {
        await db.addIntegrante(nueva.id, email);
      }
    }
    res.json({ ok: true, reserva: nueva });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.put('/api/admin/reservas/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const actualizada = await db.updateReserva(id, req.body);
    res.json({ ok: true, reserva: actualizada });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete('/api/admin/reservas/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.deleteReserva(id);
    res.json({ ok: true, mensaje: 'Reserva eliminada con éxito' });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/admin/reservas/:id/cancelar', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { porcentajeCobro } = req.body; // 0, 25, 100
    const reserva = (await db.getReservas()).find((r: any) => r.id === id);
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });

    let nuevoPrecio = 0;
    const precioBase = Number(reserva.precio || 0);
    if (porcentajeCobro === 25) {
      nuevoPrecio = Math.round(precioBase * 0.25);
    } else if (porcentajeCobro === 100) {
      nuevoPrecio = precioBase;
    }

    const actualizada = await db.updateReserva(id, {
      estado: 'cancelada',
      precio: nuevoPrecio,
    });
    res.json({ ok: true, reserva: actualizada });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 4. Clases Pendientes
app.get('/api/admin/clases-pendientes', async (req: Request, res: Response) => {
  try {
    const reservas = await db.getReservas();
    const hoyDate = new Date();
    hoyDate.setHours(0, 0, 0, 0);

    const pendientes = reservas
      .filter((r: any) => {
        if (!r.fecha_realizado || r.estado === 'cancelada') return false;
        const f = new Date(r.fecha_realizado);
        f.setHours(0, 0, 0, 0);
        return f >= hoyDate;
      })
      .map((r: any) => {
        const celdas = Array.isArray(r.celdas) ? r.celdas : (typeof r.celdas === 'string' ? JSON.parse(r.celdas || '[]') : []);
        const horaInicio = primeraHoraDesdeCeldas(celdas);
        return {
          ...r,
          celdas,
          horas: celdas.length,
          horaInicio: formatearHora(horaInicio),
        };
      })
      .sort((a: any, b: any) => new Date(a.fecha_realizado).getTime() - new Date(b.fecha_realizado).getTime());

    res.json(pendientes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Pagos y Deudas
app.get('/api/admin/pagos', async (req: Request, res: Response) => {
  try {
    const alumnos = await db.getAlumnos();
    const reservas = await db.getReservas();
    const ahora = new Date();

    const deudasPorAlumno = alumnos.map((a: any) => {
      const reservasAl = reservas.filter((r: any) => r.alumno_id === a.id);
      const itemsDeuda: any[] = [];
      let subtotalBase = 0;
      let subtotalMora = 0;

      reservasAl.forEach((r: any) => {
        const precio = Number(r.precio || 0);
        if ((r.estado === 'debe' || r.estado === 'cancelada') && precio > 0) {
          const fechaClase = r.fecha_realizado ? new Date(r.fecha_realizado) : null;
          const mora = calcularMora(fechaClase, precio, ahora);
          subtotalBase += precio;
          subtotalMora += mora;

          itemsDeuda.push({
            id: r.id,
            codigo: r.codigo,
            fecha_realizado: r.fecha_realizado,
            fecha_reservada_texto: r.fecha_reservada_texto,
            tipo_clase: r.tipo_clase,
            estado: r.estado,
            precioBase: precio,
            mora,
            total: precio + mora,
          });
        }
      });

      return {
        alumno_id: a.id,
        nombre: a.nombre,
        apellido: a.apellido,
        correo: a.correo,
        telefono: a.telefono,
        condicion_pago: a.condicion_pago,
        horas_a_favor: a.horas_a_favor,
        pack: a.pack,
        subtotalBase,
        subtotalMora,
        totalDeuda: subtotalBase + subtotalMora,
        cantidadClasesAdeudadas: itemsDeuda.length,
        itemsDeuda,
      };
    }).filter((d: any) => d.totalDeuda > 0 || d.horas_a_favor > 0);

    const pagosRecientes = reservas
      .filter((r: any) => r.estado === 'pagada')
      .slice(0, 30);

    res.json({ deudasPorAlumno, pagosRecientes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/pagos/registrar', async (req: Request, res: Response) => {
  try {
    const { reservaIds, alumnoId, monto, nota } = req.body;
    if (Array.isArray(reservaIds)) {
      for (const id of reservaIds) {
        await db.updateReserva(id, { estado: 'pagada' });
      }
    }
    if (alumnoId) {
      await db.updateAlumno(alumnoId, { condicion_pago: 'Normal' });
    }
    res.json({ ok: true, mensaje: 'Pago registrado correctamente' });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/admin/pagos/habilitar-pack', async (req: Request, res: Response) => {
  try {
    const { alumnoId, tipoPack, horasCustom } = req.body;
    const alumno = await db.getAlumnoById(alumnoId);
    if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado' });

    let horasASumar = 0;
    if (tipoPack === 'packMateria') horasASumar = 40;
    else if (tipoPack === 'packExamen') horasASumar = 20;
    else horasASumar = Number(horasCustom || 0);

    if (horasASumar <= 0) return res.status(400).json({ error: 'Cantidad de horas inválida' });

    const saldoActual = Number(alumno.horas_a_favor || 0);
    const packTotal = (Number(alumno.pack) || 0) + horasASumar;
    const nuevoSaldo = saldoActual + horasASumar;
    const hoyISO = new Date().toISOString().slice(0, 10);

    const actualizado = await db.updateAlumno(alumnoId, {
      pack: packTotal,
      horas_a_favor: nuevoSaldo,
      fecha_pago: hoyISO,
      condicion_pago: 'Normal',
    });

    res.json({ ok: true, alumno: actualizado, horasAgregadas: horasASumar });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 6. Base de Datos Status & Diagnostic
app.get('/api/admin/db-status', async (req: Request, res: Response) => {
  try {
    const hasDbUrl = Boolean(process.env.DATABASE_URL);
    let latencyMs = 0;
    let counts = { alumnos: 0, reservas: 0, reserva_integrantes: 0 };

    if (isPostgresActive && pool) {
      const start = Date.now();
      await pool.query('SELECT 1');
      latencyMs = Date.now() - start;

      const [rA, rR, rI] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM alumnos'),
        pool.query('SELECT COUNT(*) FROM reservas'),
        pool.query('SELECT COUNT(*) FROM reserva_integrantes'),
      ]);

      counts = {
        alumnos: parseInt(rA.rows[0].count, 10),
        reservas: parseInt(rR.rows[0].count, 10),
        reserva_integrantes: parseInt(rI.rows[0].count, 10),
      };

      return res.json({
        connected: true,
        mode: 'postgres',
        databaseUrlSet: hasDbUrl,
        latencyMs,
        tableCounts: counts,
      });
    }

    // Modo almacén en memoria
    return res.json({
      connected: false,
      mode: 'local_fallback',
      databaseUrlSet: hasDbUrl,
      tableCounts: {
        alumnos: localAlumnos.length,
        reservas: localReservas.length,
        reserva_integrantes: localReservaIntegrantes.length,
      },
    });
  } catch (err: any) {
    res.json({
      connected: false,
      mode: 'local_fallback',
      databaseUrlSet: Boolean(process.env.DATABASE_URL),
      error: err.message,
    });
  }
});

// 7. Consola SQL de Solo Lectura para Administrador
app.post('/api/admin/sql-runner', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Consulta SQL requerida' });
    }

    const trimmed = query.trim().toUpperCase();
    if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('EXPLAIN')) {
      return res.status(403).json({ error: 'Por seguridad, solo se permiten consultas SELECT de solo lectura.' });
    }

    if (isPostgresActive && pool) {
      const start = Date.now();
      const result = await pool.query(query);
      const latency = Date.now() - start;
      return res.json({
        ok: true,
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields?.map((f) => f.name),
        latencyMs: latency,
      });
    }

    // Si está en mock store sin base de datos conectada
    res.json({
      ok: true,
      mensaje: 'PostgreSQL no está activo en este momento. Conecte DATABASE_URL en las variables de entorno para consultas directas SQL.',
      rows: [],
      rowCount: 0,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});


// ─── ENDPOINTS COMPATIBLES CON EL SISTEMA ORIGINAL (server.js / CRUD.gs) ────
// Mantienen 100% de compatibilidad con las aplicaciones de alumnos existentes.

app.get('/ping', (req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    mensaje: 'Servidor activo',
    databaseMode: isPostgresActive ? 'PostgreSQL' : 'Almacén de datos sincronizado',
    timestamp: new Date().toISOString(),
  });
});

// GET /?funcion=...
app.get('/', async (req: Request, res: Response, next) => {
  const funcion = req.query.funcion as string;
  if (!funcion) {
    return next(); // Pasa a Vite o frontend
  }

  try {
    if (funcion === 'validarUsuarioSimplificado' || funcion === 'validarUsuario') {
      const correo = ((req.query.correo as string) || '').trim().toLowerCase();
      const contrasenia = (req.query.contrasenia as string) || '';

      if (!correo || !contrasenia) {
        return res.json({ sesion: false, error: 'Faltan correo o contraseña.' });
      }

      const alumno = await db.getAlumnoByCorreo(correo);
      if (!alumno) {
        return res.json({ sesion: false, error: 'No existe una cuenta con ese correo.' });
      }

      const passwordOk =
        contrasenia === alumno.password_hash ||
        (MASTER_PASSWORD && contrasenia === MASTER_PASSWORD);

      if (!passwordOk) {
        return res.json({ sesion: false, error: 'Contraseña incorrecta.' });
      }

      // Construir datos alumno
      const hoyD = new Date();
      hoyD.setHours(0, 0, 0, 0);
      const reservasAl = await db.getReservasByAlumnoId(alumno.id);

      let dineroQueDebe = 0;
      let dineroDebeAFuturo = 0;
      let cantidadDebe = 0;
      let fechaDeudaMasVieja: Date | null = null;
      const fechasUnicasSinPagarActivas = new Set<string>();

      for (const r of reservasAl) {
        const fechaClase = r.fecha_realizado ? new Date(r.fecha_realizado) : null;
        const esFutura = fechaClase ? fechaClase > hoyD : false;
        const precio = Number(r.precio) || 0;
        const esDeuda = (r.estado === 'debe' || r.estado === 'cancelada') && precio > 0;

        if (r.estado === 'debe' && r.fecha_realizado) {
          fechasUnicasSinPagarActivas.add(String(r.fecha_realizado));
        }

        if (esDeuda) {
          dineroQueDebe += precio;
          cantidadDebe += 1;
          if (fechaClase && (!fechaDeudaMasVieja || fechaClase < fechaDeudaMasVieja)) {
            fechaDeudaMasVieja = fechaClase;
          }
          if (r.estado === 'debe' && esFutura) {
            dineroDebeAFuturo += precio;
          }
        }
      }

      const deudaMasVieja = fechaDeudaMasVieja
        ? Math.floor((hoyD.getTime() - fechaDeudaMasVieja.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const horarios = reservasAl
        .filter((r: any) => r.estado !== 'cancelada')
        .filter((r: any) => r.fecha_realizado && new Date(r.fecha_realizado) > hoyD)
        .map((r: any) => {
          const fechaClase = new Date(r.fecha_realizado);
          const diaIndex = fechaClase.getDay() === 0 ? 6 : fechaClase.getDay() - 1;
          const nombreDia = NOMBRES_DIAS[diaIndex];
          const celdasArr = Array.isArray(r.celdas) ? r.celdas : [];
          const horaInicio = primeraHoraDesdeCeldas(celdasArr);
          const horaTexto = formatearHora(horaInicio);
          const fechaTexto = `${nombreDia} ${fechaClase.getDate()}/${fechaClase.getMonth() + 1}`;
          return {
            fecha: horaTexto ? `${fechaTexto} ${horaTexto}` : fechaTexto,
            codigo: r.codigo,
            cantidadHoras: celdasArr.length,
            hojaId: r.indice_hoja,
            celdas: r.celdas,
            semana: r.indice_hoja,
            hora: horaTexto,
          };
        });

      return res.json({
        sesion: true,
        alumno_id: alumno.id,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
        correoElectronico: alumno.correo,
        contrasenia: contrasenia,
        telefono: alumno.telefono,
        anioIngreso: alumno.anio_ingreso,
        materia: alumno.materia,
        estado: alumno.estado_materia,
        comentario: alumno.comentario,
        condicionPago: alumno.condicion_pago,
        admin: ADMIN_EMAILS.includes(String(alumno.correo || '').toLowerCase()),
        horasAFavor: alumno.horas_a_favor,
        fechaPago: alumno.fecha_pago,
        pack: alumno.pack,
        dineroQueDebe,
        dineroDebeAFuturo,
        cantidadDebe,
        deudaMasVieja,
        reservadasSinPagar: fechasUnicasSinPagarActivas.size,
        horarios,
      });
    }

    if (funcion === 'devolverDeuda') {
      const correo = ((req.query.correo as string) || '').trim().toLowerCase();
      if (!correo) return res.json([]);
      const alumno = await db.getAlumnoByCorreo(correo);
      if (!alumno) return res.json([]);
      const reservasAl = await db.getReservasByAlumnoId(alumno.id);
      const ahora = new Date();
      const resultados = [];
      let cantidadDebe = 0;

      for (const fila of reservasAl) {
        if (fila.estado === 'debe') cantidadDebe++;
        if (fila.estado !== 'debe' && fila.estado !== 'cancelada') continue;
        const fechaDeuda = fila.fecha_realizado ? new Date(fila.fecha_realizado) : null;
        const precio = Number(fila.precio) || 0;
        const celdas = Array.isArray(fila.celdas) ? fila.celdas : [];
        const horas = celdas.length;
        const recargo = calcularMora(fechaDeuda, precio, ahora);

        let fechaStr = '';
        if (fechaDeuda) {
          const diaIndex = fechaDeuda.getDay() === 0 ? 6 : fechaDeuda.getDay() - 1;
          const nombreDia = NOMBRES_DIAS[diaIndex];
          fechaStr = `${nombreDia} ${fechaDeuda.getDate()}/${fechaDeuda.getMonth() + 1}`;
        }

        resultados.push({
          fecha: fechaStr,
          horas,
          modalidad: fila.tipo_clase || 'Estándar',
          codigo: fila.codigo,
          precio,
          recargo,
          total: precio + recargo,
          cancelada: fila.estado === 'cancelada',
          reservadasSinPagar: cantidadDebe,
        });
      }
      return res.json(resultados);
    }

    if (funcion === 'cancelarReserva') {
      const codigo = ((req.query.codigo as string) || '').trim();
      const correo = ((req.query.correo as string) || '').trim().toLowerCase();
      const esAdmin = req.query.admin === 'true' || String(req.query.admin) === 'true';

      if (!codigo) return res.json({ exito: false, mensaje: 'Falta código de reserva.' });
      const todas = (await db.getReservas()).filter((r: any) => r.codigo === codigo);
      if (todas.length === 0) return res.json({ exito: false, mensaje: 'No se encontró la reserva.' });

      for (const r of todas) {
        await db.updateReserva(r.id, { estado: 'cancelada', precio: esAdmin ? 0 : r.precio });
      }
      return res.json({ exito: true, mensaje: 'Cancelación procesada con éxito.' });
    }

    return res.json({ status: false, mensaje: `Función no reconocida: ${funcion}` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST / (con funcion)
app.post('/', async (req: Request, res: Response) => {
  const { funcion, datosAlumnos } = req.body || {};

  try {
    if (funcion === 'agregarAlumno') {
      const [
        nombre,
        apellido,
        correoRaw,
        contrasenia,
        telefono,
        materia,
        anioIngresoRaw,
        estado,
        comentario,
        contrasenasIntentadas,
      ] = datosAlumnos || [];

      const correo = (correoRaw || '').trim().toLowerCase();
      if (!nombre || !apellido || !correo || !contrasenia) {
        return res.json({ status: false, mensaje: 'Faltan datos obligatorios.' });
      }

      const dup = await db.getAlumnoByCorreo(correo);
      if (dup) {
        return res.json({ status: false, mensaje: 'Ya existe una cuenta con ese correo.' });
      }

      const nuevo = await db.createAlumno({
        nombre,
        apellido,
        correo,
        password_hash: contrasenia,
        telefono,
        anio_ingreso: anioIngresoRaw,
        materia,
        estado_materia: estado,
        comentario,
        contrasenas_intentadas: contrasenasIntentadas,
      });

      return res.json({ status: true, mensaje: '¡Registro completado!', alumno_id: nuevo.id });
    }

    if (funcion === 'asignarHorario') {
      const { persona, celdas, numeroHoja, integrantes, precio, esTP, esConsulta } = req.body || {};
      const correo = (persona?.correoElectronico || '').trim().toLowerCase();
      const alumno = await db.getAlumnoByCorreo(correo);
      if (!alumno) return res.json({ ok: false, error: 'Alumno no registrado.' });

      const celdasArr = Array.isArray(celdas) ? celdas : [];
      const codigo = generarCodigoReserva();
      const lunes = lunesDeLaSemana(Number(numeroHoja) || 0);

      // Agrupar y crear
      const fechaClase = new Date(lunes);
      const { diaIndex } = parsearCelda(celdasArr[0] || 'B5');
      if (diaIndex >= 0) fechaClase.setDate(lunes.getDate() + diaIndex);

      const nueva = await db.createReserva({
        alumno_id: alumno.id,
        fecha_realizado: fechaClase.toISOString().slice(0, 10),
        fecha_reservada_texto: `Clase (${celdasArr.length} h)`,
        estado: alumno.horas_a_favor >= celdasArr.length ? 'pack' : 'debe',
        celdas: celdasArr,
        tipo_clase: `${esTP ? 'tp' : esConsulta ? 'consulta' : 'estandar'}_${integrantes?.length > 1 ? 'grupal' : 'individual'}`,
        codigo,
        precio: Number(precio) || 0,
        indice_hoja: Number(numeroHoja) || 0,
      });

      if (alumno.horas_a_favor >= celdasArr.length) {
        await db.updateAlumno(alumno.id, {
          horas_a_favor: alumno.horas_a_favor - celdasArr.length,
        });
      }

      return res.json({ ok: true, exito: true, codigo, reservas: [nueva.id] });
    }

    if (funcion === 'registrarPagoAutomatico') {
      const { correo, referencia, monto } = req.body || {};
      const alumno = await db.getAlumnoByCorreo(correo);
      if (!alumno) return res.json({ error: 'Correo no encontrado' });

      const refs = Array.isArray(referencia) ? referencia : [referencia];
      const reservasAl = await db.getReservasByAlumnoId(alumno.id);

      for (const r of reservasAl) {
        if (refs.includes(r.codigo)) {
          await db.updateReserva(r.id, { estado: 'pagada' });
        }
      }

      await db.updateAlumno(alumno.id, { condicion_pago: 'Normal' });
      return res.json({ error: false });
    }

    return res.json({ status: true, mensaje: 'Mensaje recibido correctamente' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ─── VITE MIDDLEWARE (DEV) O SERVIDO ESTÁTICO (PROD) ─────────────────────────
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor y Panel de Administración listos en http://localhost:${PORT}`);
  });
}

startServer();
