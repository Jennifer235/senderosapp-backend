-- =============================================================
-- Senderosapp - Paso 2: tablas y datos iniciales
-- Ejecutar conectado a la base "senderos_db":
--   psql -U postgres -d senderos_db -f 02_tablas.sql
-- Se puede ejecutar varias veces: borra y vuelve a crear todo.
-- =============================================================

BEGIN;

DROP TABLE IF EXISTS ventas;
DROP TABLE IF EXISTS sendero_accesorios;
DROP TABLE IF EXISTS accesorios;
DROP TABLE IF EXISTS senderos;
DROP TABLE IF EXISTS usuarios;

-- -------------------------------------------------------------
-- USUARIOS  ->  /api/v1/usuarios
-- -------------------------------------------------------------
CREATE TABLE usuarios (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    apellido        VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    telefono        VARCHAR(20),
    contrasena      VARCHAR(255) NOT NULL,          -- guardar el hash, nunca el texto plano
    rol             VARCHAR(20)  NOT NULL DEFAULT 'senderista'
                    CHECK (rol IN ('senderista', 'guia', 'admin')),
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_registro  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- SENDEROS  ->  /api/v1/senderos
-- -------------------------------------------------------------
CREATE TABLE senderos (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(150)  NOT NULL UNIQUE,
    descripcion     TEXT,
    ubicacion       VARCHAR(150),
    distancia_km    NUMERIC(5,2)  NOT NULL CHECK (distancia_km > 0),
    dificultad      VARCHAR(10)   NOT NULL
                    CHECK (dificultad IN ('Baja', 'Media', 'Alta')),
    duracion_horas  NUMERIC(4,1)  CHECK (duracion_horas > 0),
    altitud_max_m   INTEGER       CHECK (altitud_max_m >= 0),
    activo          BOOLEAN       NOT NULL DEFAULT TRUE,
    fecha_creacion  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- ACCESORIOS  ->  /api/v1/accesorios
-- -------------------------------------------------------------
CREATE TABLE accesorios (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(100)  NOT NULL UNIQUE,
    descripcion     TEXT,
    categoria       VARCHAR(50)   NOT NULL,
    precio          NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (precio >= 0),
    stock           INTEGER       NOT NULL DEFAULT 0 CHECK (stock >= 0),
    activo          BOOLEAN       NOT NULL DEFAULT TRUE,
    fecha_creacion  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- VENTAS: qué accesorio compró cada usuario
-- (relación entre usuarios y accesorios)
-- Los senderos quedan independientes: son solo informativos.
-- -------------------------------------------------------------
CREATE TABLE ventas (
    id               SERIAL PRIMARY KEY,
    usuario_id       INTEGER       NOT NULL REFERENCES usuarios(id)   ON DELETE RESTRICT,
    accesorio_id     INTEGER       NOT NULL REFERENCES accesorios(id) ON DELETE RESTRICT,
    cantidad         INTEGER       NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario  NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
    total            NUMERIC(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    fecha_venta      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ventas_usuario   ON ventas(usuario_id);
CREATE INDEX idx_ventas_accesorio ON ventas(accesorio_id);

CREATE INDEX idx_senderos_dificultad ON senderos(dificultad);
CREATE INDEX idx_accesorios_categoria ON accesorios(categoria);

-- -------------------------------------------------------------
-- DATOS INICIALES
-- -------------------------------------------------------------
-- Los mismos 10 senderos que hoy están fijos en tabla.ts
INSERT INTO senderos (nombre, ubicacion, distancia_km, dificultad) VALUES
    ('Camino a Monserrate',   'Bogotá', 2.5, 'Media'),
    ('Quebrada La Vieja',     'Bogotá', 3.0, 'Media'),
    ('Quebrada Las Delicias', 'Bogotá', 5.0, 'Alta'),
    ('Aguas Claras',          'Bogotá', 4.5, 'Media'),
    ('Chorro de Padilla',     'Bogotá', 5.0, 'Media'),
    ('Cerro de Guadalupe',    'Bogotá', 3.0, 'Media'),
    ('Parque Entrenubes',     'Bogotá', 6.0, 'Baja'),
    ('La Aguadora',           'Bogotá', 4.0, 'Alta'),
    ('Páramo de Cruz Verde',  'Bogotá', 8.0, 'Alta'),
    ('Humedal La Conejera',   'Bogotá', 2.0, 'Baja');

INSERT INTO accesorios (nombre, descripcion, categoria, precio, stock) VALUES
    ('Bastón de trekking',   'Bastón ajustable de aluminio',         'Equipo',      85000, 20),
    ('Botas impermeables',   'Botas de montaña con suela antideslizante', 'Calzado', 250000, 10),
    ('Chaqueta impermeable', 'Chaqueta cortavientos y de lluvia',    'Ropa',       180000, 15),
    ('Termo 1 L',            'Botella térmica de acero inoxidable',  'Hidratación', 60000, 30),
    ('Linterna frontal',     'Linterna LED recargable',              'Equipo',      45000, 25);

INSERT INTO usuarios (nombre, apellido, email, telefono, contrasena, rol) VALUES
    ('Admin', 'Senderos', 'admin@senderosapp.com', '3000000000', 'cambiar_por_hash', 'admin');

-- Venta de ejemplo: el admin compra 2 bastones (precio tomado del accesorio)
INSERT INTO ventas (usuario_id, accesorio_id, cantidad, precio_unitario)
SELECT u.id, a.id, 2, a.precio
FROM usuarios u, accesorios a
WHERE u.email = 'admin@senderosapp.com' AND a.nombre = 'Bastón de trekking';

COMMIT;
