import { crearCrud } from '../crud';

export default crearCrud({
  tabla: 'senderos',
  columnas: ['nombre', 'descripcion', 'ubicacion', 'distancia_km', 'dificultad',
             'duracion_horas', 'altitud_max_m', 'activo'],
});
