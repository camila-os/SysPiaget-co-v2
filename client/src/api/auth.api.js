import axios from "axios";

const API_URL = "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor de request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  
  console.log('🔐 Interceptor request - Token encontrado:', 
    token ? `${typeof token} - ${token.substring(0, 20)}...` : 'AUSENTE');
  
  // ✅ DETECTAR Y PREVENIR TOKEN CORRUPTO
  if (token && (token === 'true' || token === true || token === 'false' || token === false)) {
    console.error('❌ TOKEN CORRUPTO DETECTADO: Es booleano en lugar de JWT');
    
    // Limpiar token corrupto
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("rol");
    localStorage.removeItem("name");
    localStorage.removeItem("primer_login");
    localStorage.removeItem("employeeFullName");
    
    // Redirigir a login
    window.location.href = '/login';
    return Promise.reject(new Error('Token corrupto - redirigiendo a login'));
  }
  
  if (token && typeof token === 'string' && token.startsWith('eyJ')) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('✅ Token válido agregado a headers');
  } else if (token) {
    console.warn('⚠️ Token presente pero con formato inesperado:', typeof token, token);
    // No agregar token inválido a los headers
  }
  
  return config;
});

// Interceptor de response
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const url = error.config?.url || '';
    const method = error.config?.method?.toUpperCase() || 'GET';
    
    console.log('🔍 Interceptor de respuesta - Error:', `${method} ${url}`);
    console.log('📊 Detalles del error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    // ✅ EXCEPCIÓN: No transformar errores para verificación de DNI de tutores
    if (url.includes('/tutores/dni/')) {
      console.log('🔍 [Interceptor] Error de verificación DNI tutor - NO transformar');
      return Promise.reject(error);
    }
    
    // Manejo específico para cambio de contraseña
    if (url.includes('/login/login/') && !url.includes('cambiar-password')) {
      const customError = error.response?.data?.message || 
                         error.response?.data?.error || 
                         "Credenciales incorrectas";
      return Promise.reject(new Error(customError));
    }
    
    // ✅ MANEJO ESPECÍFICO PARA ERRORES 500 (Internal Server Error)
    if (error.response?.status === 500) {
      console.error('🚨 ERROR 500 - Problema interno del servidor:', {
        url: url,
        method: method,
        dataEnviada: error.config?.data,
        respuesta: error.response?.data
      });
      
      let errorMessage = 'Error interno del servidor.\n';
      if (error.response?.data?.detail) {
        errorMessage += `Detalles: ${error.response.data.detail}`;
      } else if (error.response?.data?.error) {
        errorMessage += `Error: ${error.response.data.error}`;
      }
      
      return Promise.reject(new Error(errorMessage));
    }
    
    // ✅ MANEJO ESPECÍFICO PARA ERRORES 400 (Bad Request)
    if (error.response?.status === 400) {
      const validationErrors = error.response.data;
      console.log('❌ ERROR 400 COMPLETO - ESTRUCTURA:', validationErrors);
      
      // ✅ MOSTRAR EL CONTENIDO EXACTO DEL ERROR id_empleado
      if (validationErrors.id_empleado) {
        console.log('🔍 ERROR id_empleado DETALLADO:', {
          tipo: typeof validationErrors.id_empleado,
          valor: validationErrors.id_empleado,
          longitud: validationErrors.id_empleado.length,
          contenido: validationErrors.id_empleado[0]
        });
      }
      
    return Promise.reject(validationErrors);
  }
    
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh");
      
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/login/token/refresh/`, {
            refresh: refreshToken,
          });
          localStorage.setItem("token", res.data.access);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest);
        } catch (err) {
          logoutUser();
          return Promise.reject(err);
        }
      }
    }
    
    const customError = error.response?.data?.message || 
                       error.response?.data?.error || 
                       "Error de conexión con el servidor";
    return Promise.reject(new Error(customError));
  }
);

// 🔐 AUTH FUNCTIONS
export const loginUser = async (dni, password) => {
  try {
    console.log('🔐 Enviando petición de login...');
    const response = await api.post("/login/login/", { dni, password });
    console.log('✅ Respuesta del servidor recibida:', response.status);
    return response.data;
  } catch (error) {
    console.error('❌ Error en loginUser:', {
      message: error.message,
      response: error.response,
      status: error.response?.status
    });
    
    if (error.response?.status === 401) {
      throw new Error("Credenciales incorrectas. Verifique su DNI y contraseña.");
    } else if (error.response?.status === 400) {
      throw new Error("Datos inválidos. Verifique el formato de los datos.");
    } else if (error.response?.status === 500) {
      throw new Error("Error del servidor. Intente más tarde.");
    } else if (error.message.includes("Network Error")) {
      throw new Error("Error de conexión. Verifique su internet.");
    } else {
      throw new Error(error.message || "Error al iniciar sesión");
    }
  }
};

// ✅ NUEVA FUNCIÓN: Obtener información del usuario logueado
export const getUserInfo = async () => {
  try {
    console.log('🔄 Obteniendo información del usuario...');
    
    // ✅ PRIMERO: Intentar con el nuevo endpoint user_info
    try {
      const response = await api.get('/login/user-info/');
      console.log('📡 Respuesta de user-info:', response.data);
      return response.data;
    } catch (userInfoError) {
      console.log('⚠️ Endpoint user-info no disponible, usando auth/check');
      // ✅ FALLBACK: Usar el endpoint check_auth mejorado
      const response = await api.get('/login/auth/check/');
      console.log('📡 Respuesta de auth/check:', response.data);
      return response.data;
    }
    
  } catch (error) {
    console.error('❌ Error en getUserInfo:', error);
    
    // ✅ FALLBACK FINAL: Usar localStorage
    console.log('🔄 Usando información de localStorage como fallback');
    const fallbackInfo = {
      id_empleado: localStorage.getItem("user_id"),
      rol: localStorage.getItem("rol"),
      nombre_completo: localStorage.getItem("employeeFullName"),
      username: localStorage.getItem("name"),
      primer_login: localStorage.getItem("primer_login") === "true"
    };
    
    console.log('👤 Información de fallback:', fallbackInfo);
    return fallbackInfo;
  }
};

export const saveUserData = (data) => {
  console.log('💾 saveUserData - INICIANDO...');
  console.log('📦 Datos recibidos para guardar:', data);
  
  // ✅ VALIDACIÓN ROBUSTA DEL TOKEN
  if (!data.access) {
    console.error('❌ ERROR: No se recibió access token en la respuesta');
    throw new Error('No se recibió token de acceso del servidor');
  }
  
  if (typeof data.access !== 'string') {
    console.error('❌ ERROR: Access token no es un string:', typeof data.access, data.access);
    throw new Error('Token de acceso inválido');
  }
  
  if (data.access === 'true' || data.access === true) {
    console.error('❌ ERROR: Access token es un booleano en lugar de JWT');
    throw new Error('Token de acceso inválido (booleano)');
  }
  
  if (!data.access.startsWith('eyJ')) {
    console.error('❌ ERROR: Access token no tiene formato JWT válido');
    throw new Error('Token de acceso con formato inválido');
  }
  
  // ✅ GUARDAR TOKEN CORRECTAMENTE
  const token = data.access;
  localStorage.setItem("token", token);
  console.log('✅ Token guardado en localStorage:', token.substring(0, 20) + '...');
  
  // ✅ GUARDAR REFRESH TOKEN SI EXISTE
  if (data.refresh && typeof data.refresh === 'string') {
    localStorage.setItem("refresh", data.refresh);
    console.log('✅ Refresh token guardado');
  }
  
  // ✅ GUARDAR ROL CON VALIDACIÓN
  if (data.rol && typeof data.rol === 'string') {
    const normalizedRole = data.rol.toLowerCase();
    localStorage.setItem("rol", normalizedRole);
    console.log('✅ Rol guardado:', normalizedRole);
  } else {
    console.error('❌ ERROR: Rol inválido o no proporcionado');
    throw new Error('Rol de usuario no proporcionado');
  }
  
  // ✅ GUARDAR NOMBRE COMPLETO
  const nombreCompleto = `${data.nombre || ''} ${data.apellido || ''}`.trim();
  if (nombreCompleto) {
    localStorage.setItem("employeeFullName", nombreCompleto);
    console.log('✅ Nombre completo guardado:', nombreCompleto);
  } else {
    const username = data.username || data.dni;
    localStorage.setItem("employeeFullName", username);
    console.log('✅ Username guardado como nombre:', username);
  }
  
  // ✅ GUARDAR USERNAME
  const username = data.username || data.dni;
  if (username) {
    localStorage.setItem("name", username);
    console.log('✅ Username guardado:', username);
  }
  
  // ✅ GUARDAR PRIMER LOGIN
  if (data.primer_login !== undefined && data.primer_login !== null) {
    const primerLogin = Boolean(data.primer_login);
    localStorage.setItem("primer_login", primerLogin.toString());
    console.log('✅ Primer login guardado:', primerLogin);
  }
  
  // ✅ GUARDAR USER_ID SI ESTÁ DISPONIBLE
  if (data.user_id || data.id_empleado) {
    const userId = data.user_id || data.id_empleado;
    localStorage.setItem("user_id", userId.toString());
    console.log('✅ User ID guardado:', userId);
  }
  
  // ✅ VERIFICACIÓN FINAL
  console.log('📋 VERIFICACIÓN FINAL localStorage:');
  console.log('- Token:', localStorage.getItem("token") ? 'PRESENTE' : 'AUSENTE');
  console.log('- Rol:', localStorage.getItem("rol"));
  console.log('- Nombre completo:', localStorage.getItem("employeeFullName"));
  console.log('- Username:', localStorage.getItem("name"));
  console.log('- Primer login:', localStorage.getItem("primer_login"));
  console.log('- User ID:', localStorage.getItem("user_id"));
  
  return true;
};

export const getToken = () => localStorage.getItem("token");
export const getUserRole = () => localStorage.getItem("rol");
export const getUserName = () => localStorage.getItem("name") || "Usuario";
export const getUserId = () => localStorage.getItem("user_id");
export const getEmployeeFullName = () => localStorage.getItem("employeeFullName") || "Usuario";
export const isFirstLogin = () => localStorage.getItem("primer_login") === "true";

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh");
  localStorage.removeItem("rol");
  localStorage.removeItem("name");
  localStorage.removeItem("primer_login");
  localStorage.removeItem("employeeFullName");
  localStorage.removeItem("user_id");
  window.location.href = "/";
};

export const checkAuth = async () => {
  try {
    const token = getToken();
    console.log('🔐 checkAuth - Token presente:', !!token);
    
    if (!token) {
      throw new Error("No token found");
    }
    
    console.log('🔐 checkAuth - Verificando token con el servidor...');
    const response = await api.get("/login/auth/check/");
    console.log('✅ checkAuth - Token válido');
    return response.data;
  } catch (error) {
    console.error('❌ checkAuth - Error:', error.message);
    throw error;
  }
};

export const verifyTokenIntegrity = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("rol");
  
  console.log('🔍 Verificando integridad del token...');
  console.log('- Token:', token ? `${typeof token} - ${token.substring(0, 20)}...` : 'AUSENTE');
  console.log('- Rol:', role);
  
  // Detectar token corrupto
  if (token && (token === 'true' || token === true || token === 'false' || token === false)) {
    console.error('❌ TOKEN CORRUPTO DETECTADO');
    return false;
  }
  
  // Verificar que tenemos todos los datos necesarios
  if (!token || !role) {
    console.error('❌ FALTAN DATOS ESENCIALES');
    return false;
  }
  
  console.log('✅ Integridad del token verificada');
  return true;
};

export const initializeAuth = () => {
  console.log('🚀 Inicializando autenticación...');
  
  if (!verifyTokenIntegrity()) {
    console.log('🔄 Limpiando datos corruptos...');
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("rol");
    localStorage.removeItem("name");
    localStorage.removeItem("primer_login");
    localStorage.removeItem("employeeFullName");
    localStorage.removeItem("user_id");
    console.log('✅ Datos corruptos limpiados');
  } else {
    console.log('✅ Token válido - autenticación lista');
  }
};

export const cambiarPassword = async (data) => {
  try {
    console.log('🔐 Enviando petición de cambio de contraseña...');
    console.log('📤 Datos enviados:', data);
    
    const response = await api.post("/login/login/cambiar-password/", data);
    
    console.log('✅ Contraseña cambiada exitosamente:', response.status);
    return response.data;
  } catch (error) {
    console.error('❌ Error en cambiarPassword:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    if (error.response?.status === 400) {
      const errorMsg = error.response.data?.error || "Datos inválidos";
      throw new Error(errorMsg);
    } else if (error.response?.status === 401) {
      throw new Error("No autorizado. Por favor, inicie sesión nuevamente.");
    } else if (error.response?.status === 403) {
      throw new Error("No tiene permisos para realizar esta acción.");
    } else if (error.message.includes("Network Error")) {
      throw new Error("Error de conexión. Verifique su internet.");
    } else {
      throw new Error(error.message || "Error al cambiar contraseña");
    }
  }
};

export default api;