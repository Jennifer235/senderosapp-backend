import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pool } from './db';

// Si la base de datos está vacía (por ejemplo, recién creada en Render),
// ejecuta database/02_tablas.sql para crear las tablas y los datos de prueba.
// Si las tablas ya existen, no toca nada.
export async function prepararBaseDeDatos(): Promise<void> {
  const r = await pool.query("SELECT to_regclass('public.usuarios') AS tabla");
  if (r.rows[0].tabla) return;

  const sql = readFileSync(join(__dirname, '..', 'database', '02_tablas.sql'), 'utf8');
  await pool.query(sql);
  console.log('Base de datos vacía: se crearon las tablas y los datos de prueba.');
}
