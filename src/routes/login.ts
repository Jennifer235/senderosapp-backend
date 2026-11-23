import { Router } from 'express';
import { scryptSync, timingSafeEqual } from 'node:crypto';
import { pool } from '../db';

const router = Router();

// Compara la contraseña escrita con la guardada en la base de datos
function contrasenaValida(escrita: string, guardada: string): boolean {
  // Formato cifrado "sal:hash" (usuarios creados desde la API)
  if (guardada.includes(':')) {
    const [sal = '', hash = ''] = guardada.split(':');
    const calculado = scryptSync(escrita, sal, 64);
    const esperado = Buffer.from(hash, 'hex');
    return esperado.length === calculado.length && timingSafeEqual(calculado, esperado);
  }
  // Datos de prueba insertados por SQL en texto plano (ej. 'cambiar_por_hash')
  return escrita === guardada;
}

// POST /api/v1/login   body: { usuario: email, contrasena }
// Responde true si el usuario existe, está activo y la contraseña coincide; si no, false
router.post('/', async (req, res) => {
  const { usuario, contrasena } = req.body ?? {};
  if (typeof usuario !== 'string' || typeof contrasena !== 'string') {
    return void res.status(400).json({ error: 'Debe enviar usuario y contrasena' });
  }

  const r = await pool.query(
    'SELECT contrasena FROM usuarios WHERE email = $1 AND activo = TRUE',
    [usuario],
  );

  const ok = r.rows.length > 0 && contrasenaValida(contrasena, r.rows[0].contrasena);
  res.json(ok);
});

export default router;
