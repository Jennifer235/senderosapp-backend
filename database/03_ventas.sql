-- =============================================================
-- Senderosapp - Paso 3: cambio sin borrar datos
-- Quita sendero_accesorios y crea ventas (usuarios <-> accesorios)
-- Ejecutar conectado a "senderos_db"
-- =============================================================
BEGIN;

DROP TABLE IF EXISTS sendero_accesorios;

CREATE TABLE IF NOT EXISTS ventas (
    id               SERIAL PRIMARY KEY,
    usuario_id       INTEGER       NOT NULL REFERENCES usuarios(id)   ON DELETE RESTRICT,
    accesorio_id     INTEGER       NOT NULL REFERENCES accesorios(id) ON DELETE RESTRICT,
    cantidad         INTEGER       NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario  NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
    total            NUMERIC(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    fecha_venta      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ventas_usuario   ON ventas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ventas_accesorio ON ventas(accesorio_id);

COMMIT;
