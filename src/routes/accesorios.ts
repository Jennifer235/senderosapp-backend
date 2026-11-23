import { crearCrud } from '../crud';

export default crearCrud({
  tabla: 'accesorios',
  columnas: ['nombre', 'descripcion', 'categoria', 'precio', 'stock', 'activo'],
});
