-- =============================================================
-- Senderosapp - Paso 1: crear la base de datos
-- Ejecutar conectado a la base "postgres" (por ejemplo en pgAdmin
-- o con: psql -U postgres -f 01_crear_base_datos.sql)
-- =============================================================
CREATE DATABASE senderos_db
    WITH ENCODING = 'UTF8'
    TEMPLATE = template0;
