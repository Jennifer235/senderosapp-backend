import 'dotenv/config';
import { Pool, types } from 'pg';

// Los NUMERIC (precio, distancia_km...) llegan como texto; los convertimos a número
types.setTypeParser(types.builtins.NUMERIC, (valor) => parseFloat(valor));

// Conexión a PostgreSQL:
// - En la nube (Railway) se usa DATABASE_URL, que apunta a la base PostgreSQL de Railway.
// - En tu computador se usan los datos del archivo .env.
export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      // La red interna de Railway (*.railway.internal) no usa SSL; una URL pública sí
      ssl:
        process.env.DB_SSL === 'false' || process.env.DATABASE_URL.includes('.railway.internal')
          ? false
          : { rejectUnauthorized: false },
    })
  : new Pool({
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      user: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME ?? 'senderos_db',
    });

// Prueba rápida de conexión: npm run probar-db
if (require.main === module) {
  pool
    .query('SELECT COUNT(*) AS total FROM senderos')
    .then((r) => console.log('Conectado a PostgreSQL. Senderos:', r.rows[0].total))
    .catch((e) => console.error('Error de conexión:', e.message))
    .finally(() => pool.end());
}
