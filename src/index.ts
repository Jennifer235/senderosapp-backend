import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { pool } from './db';
import usuarios from './routes/usuarios';
import senderos from './routes/senderos';
import accesorios from './routes/accesorios';
import login from './routes/login';

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(cors({ origin: 'http://localhost:4200' })); // permite peticiones desde Angular
app.use(express.json());                           // lee el body en formato JSON

// Rutas que usan los servicios de Angular
app.use('/api/v1/usuarios', usuarios);
app.use('/api/v1/senderos', senderos);
app.use('/api/v1/accesorios', accesorios);
app.use('/api/v1/login', login);

// Comprobar que el servidor y la base responden
app.get('/api/v1/salud', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ estado: 'ok', baseDeDatos: 'conectada' });
});

// Ruta no encontrada
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores (incluye errores de PostgreSQL)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const errores: Record<string, [number, string]> = {
    '23505': [409, 'Ya existe un registro con ese valor único'],
    '23502': [400, 'Falta un campo obligatorio'],
    '23514': [400, 'Un valor no cumple las reglas (por ejemplo, dificultad o precio)'],
    '22P02': [400, 'Un valor tiene un formato inválido'],
    '23503': [400, 'El registro relacionado no existe'],
  };
  const conocido = errores[err?.code];
  if (conocido) {
    return void res.status(conocido[0]).json({ error: conocido[1], detalle: err.detail ?? err.column });
  }
  if (err?.type === 'entity.parse.failed') {
    return void res.status(400).json({ error: 'El JSON enviado no es válido' });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor Senderosapp en http://localhost:${PORT}/api/v1`);
});
