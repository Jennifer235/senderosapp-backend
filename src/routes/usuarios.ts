import { scryptSync, randomBytes } from 'node:crypto';
import { crearCrud } from '../crud';

// Guarda la contraseña cifrada (sal:hash), nunca en texto plano
function cifrar(contrasena: string): string {
  const sal = randomBytes(16).toString('hex');
  return `${sal}:${scryptSync(contrasena, sal, 64).toString('hex')}`;
}

export default crearCrud({
  tabla: 'usuarios',
  columnas: ['nombre', 'apellido', 'email', 'telefono', 'contrasena', 'rol', 'activo'],
  ocultar: ['contrasena'],
  antesDeGuardar: (datos) => {
    if (typeof datos.contrasena === 'string') datos.contrasena = cifrar(datos.contrasena);
    return datos;
  },
});
