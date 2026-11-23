import { Router, type Request, type Response } from 'express';
import { pool } from './db';

// Configuración de cada tabla
interface OpcionesCrud {
  tabla: string;                  // nombre de la tabla en PostgreSQL
  columnas: string[];             // columnas que se pueden crear/editar
  ocultar?: string[];             // columnas que nunca se devuelven (ej. contraseña)
  antesDeGuardar?: (datos: Record<string, unknown>) => Record<string, unknown>;
}

// Crea las 6 rutas (GET, GET/:id, POST, PUT, PATCH, DELETE) para una tabla
export function crearCrud(opciones: OpcionesCrud): Router {
  const { tabla, columnas, ocultar = [], antesDeGuardar = (d) => d } = opciones;
  const router = Router();

  // Quita las columnas ocultas antes de responder
  const limpiar = (fila: Record<string, unknown>) => {
    const copia = { ...fila };
    for (const c of ocultar) delete copia[c];
    return copia;
  };

  // Toma del body solo las columnas permitidas
  const tomarDatos = (body: Record<string, unknown>, todas: boolean) => {
    const datos: Record<string, unknown> = {};
    for (const c of columnas) {
      if (body?.[c] !== undefined) datos[c] = body[c];
      else if (todas) datos[c] = null; // PUT: lo que no se envía queda en null
    }
    return antesDeGuardar(datos);
  };

  const leerId = (req: Request, res: Response): number | null => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'El id debe ser un número entero positivo' });
      return null;
    }
    return id;
  };

  // GET /  -> todos
  router.get('/', async (_req, res) => {
    const r = await pool.query(`SELECT * FROM ${tabla} ORDER BY id`);
    res.json(r.rows.map(limpiar));
  });

  // GET /:id -> uno
  router.get('/:id', async (req, res) => {
    const id = leerId(req, res);
    if (id === null) return;
    const r = await pool.query(`SELECT * FROM ${tabla} WHERE id = $1`, [id]);
    if (r.rowCount === 0) return void res.status(404).json({ error: 'No encontrado' });
    res.json(limpiar(r.rows[0]));
  });

  // POST / -> crear
  router.post('/', async (req, res) => {
    const datos = tomarDatos(req.body, false);
    const cols = Object.keys(datos);
    if (cols.length === 0) return void res.status(400).json({ error: 'No se enviaron datos' });
    const params = cols.map((_, i) => `$${i + 1}`).join(', ');
    const r = await pool.query(
      `INSERT INTO ${tabla} (${cols.join(', ')}) VALUES (${params}) RETURNING *`,
      Object.values(datos),
    );
    res.status(201).json(limpiar(r.rows[0]));
  });

  // PUT /:id (todo) y PATCH /:id (parcial) -> actualizar
  const actualizar = (todas: boolean) => async (req: Request, res: Response) => {
    const id = leerId(req, res);
    if (id === null) return;
    const datos = tomarDatos(req.body, todas);
    const cols = Object.keys(datos);
    if (cols.length === 0) return void res.status(400).json({ error: 'No se enviaron datos' });
    const set = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
    const r = await pool.query(
      `UPDATE ${tabla} SET ${set} WHERE id = $${cols.length + 1} RETURNING *`,
      [...Object.values(datos), id],
    );
    if (r.rowCount === 0) return void res.status(404).json({ error: 'No encontrado' });
    res.json(limpiar(r.rows[0]));
  };
  router.put('/:id', actualizar(true));
  router.patch('/:id', actualizar(false));

  // DELETE /:id -> eliminar
  router.delete('/:id', async (req, res) => {
    const id = leerId(req, res);
    if (id === null) return;
    const r = await pool.query(`DELETE FROM ${tabla} WHERE id = $1 RETURNING *`, [id]);
    if (r.rowCount === 0) return void res.status(404).json({ error: 'No encontrado' });
    res.json({ mensaje: 'Eliminado', registro: limpiar(r.rows[0]) });
  });

  return router;
}
