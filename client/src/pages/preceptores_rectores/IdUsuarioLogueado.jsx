// En IdUsuarioLogueado.jsx - VERSIÓN FINAL
import { checkAuth } from '../../api/auth.api';

export const obtenerIdEmpleadoLogueado = async () => {
  console.log('🔍 Buscando ID del empleado logueado...');

  // ✅ PRIMERO: Usar el endpoint check_auth mejorado
  try {
    console.log('🔄 Verificando autenticación con el servidor...');
    const authInfo = await checkAuth();
    console.log('👤 Información de autenticación recibida:', authInfo);
    
    // Buscar el ID en diferentes propiedades posibles
    const idFromAuth = authInfo.id_empleado || authInfo.id || authInfo.user_id;
    console.log('🎯 ID encontrado en auth check:', idFromAuth);

    if (idFromAuth) {
      const idNum = parseInt(idFromAuth);
      console.log('✅ ID numérico encontrado desde API:', idNum);
      localStorage.setItem("user_id", idNum.toString());
      return idNum;
    } else {
      console.warn('⚠️ No se encontró ID en la respuesta de autenticación');
    }
  } catch (authError) {
    console.error('❌ Error en checkAuth:', authError);
  }

  // ✅ SEGUNDO: Buscar en localStorage
  const user_id = localStorage.getItem("user_id");
  console.log('📦 user_id en localStorage:', user_id);
  
  if (user_id && user_id !== 'null' && user_id !== 'undefined') {
    const idNum = parseInt(user_id);
    if (!isNaN(idNum)) {
      console.log('✅ ID encontrado en localStorage:', idNum);
      return idNum;
    }
  }

  // ✅ TERCERO: Usar el token decodificado
  const token = localStorage.getItem("token");
  if (token) {
    try {
      console.log('🔍 Decodificando token...');
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('📝 Payload del token:', payload);
      
      const idFromToken = payload.user_id;
      console.log('🎯 ID encontrado en token:', idFromToken);
      
      if (idFromToken) {
        const idNum = parseInt(idFromToken);
        console.log('✅ ID encontrado en token:', idNum);
        localStorage.setItem("user_id", idNum.toString());
        return idNum;
      }
    } catch (tokenError) {
      console.error('❌ Error decodificando token:', tokenError);
    }
  }

  console.error('❌ No se pudo obtener el ID del empleado');
  throw new Error('No se pudo identificar al empleado logueado');
};