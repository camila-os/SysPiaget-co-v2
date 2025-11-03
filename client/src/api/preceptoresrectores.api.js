import api from './auth.api';

// LUGARES
export const getAllLugares = () => api.get('/preceptores_rectores/lugares/');
export const createLugar = (data) => api.post('/preceptores_rectores/lugares/', data);
// TIPOS DE INCIDENCIAS
export const getAllTiposIncidencias = () => api.get('/preceptores_rectores/tipos-incidencias/');
export const createTipoIncidencia = (data) => api.post('/preceptores_rectores/tipos-incidencias/', data);

// INCIDENCIAS
export const getAllIncidencias = () => api.get('/preceptores_rectores/incidencias/');
export const createIncidencia = (data) => api.post('/preceptores_rectores/incidencias/', data);
export const updateIncidencia = (id, data) => api.put(`/preceptores_rectores/incidencias/${id}/`, data);
export const deleteIncidencia = (id) => api.delete(`/preceptores_rectores/incidencias/${id}/`);

// MEDIDAS X ALUMNO
export const getAllMedidas = () => api.get('/preceptores_rectores/medidas/');
export const getMedidaById = (id) => api.get(`/preceptores_rectores/medidas/${id}/`);
export const createMedida = (data) => api.post('/preceptores_rectores/medidas/', data);
export const updateMedida = (id, data) => api.put(`/preceptores_rectores/medidas/${id}/`, data);

// REUNIONES
export const getAllReuniones = () => api.get('/preceptores_rectores/reuniones/');
export const getReunionById = (id) => api.get(`/preceptores_rectores/reuniones/${id}/`);
export const createReunion = (data) => api.post('/preceptores_rectores/reuniones/', data);
export const updateReunion = (id, data) => api.put(`/preceptores_rectores/reuniones/${id}/`, data);

// ASISTENCIAS
export const getAllAsistencias = () => api.get('/preceptores_rectores/asistencias/');
export const getAsistenciaById = (id) => api.get(`/preceptores_rectores/asistencias/${id}/`);
export const createAsistencia = (data) => api.post('/preceptores_rectores/asistencias/', data);
export const updateAsistencia = (id, data) => api.put(`/preceptores_rectores/asistencias/${id}/`, data);

// ACTIVIDADES EXTRACURRICULARES
export const getAllActividades = () => api.get('/preceptores_rectores/act-extracurriculares/');
export const getActividadById = (id) => api.get(`/preceptores_rectores/act-extracurriculares/${id}/`);
export const createActividad = (data) => api.post('/preceptores_rectores/act-extracurriculares/', data);
export const updateActividad = (id, data) => api.put(`/preceptores_rectores/act-extracurriculares/${id}/`, data);

// ACTIVIDADES POR GRADO
export const getAllActividadesXGrado = () => api.get('/preceptores_rectores/actividades-grados/');

// TUTORES Y GRADOS
export const getAllTutores = () => api.get('/secretarios/tutores/');
export const getAllGrados = () => api.get('/secretarios/grados/');

// Función auxiliar para formatear la respuesta del alumno
const formatAlumnoResponse = (alumno) => {
  // Log para debug
  console.log('📝 [API] Formateando alumno:', alumno);
  
  const formattedAlumno = {
    id_alumno: alumno.id_alumno || alumno.id || alumno.id_alumno || 0,
    dni_alumno: alumno.dni_alumno || alumno.dni_alumno || alumno.dni_alumno || 'N/A',
    nombre_alumno: alumno.nombre_alumno || alumno.nombre_alumno || alumno.nombre_alumno || 'Nombre no disponible',
    apellido_alumno: alumno.apellido_alumno || alumno.apellido_alumno || alumno.apellido_alumno || 'Apellido no disponible',
    curso: alumno.curso || alumno.grado || alumno.id_grado || alumno.nombre_grado || ''
  };
  
  console.log('✅ [API] Alumno formateado:', formattedAlumno);
  return { data: formattedAlumno };
};

// ✅ FUNCIÓN ALTERNATIVA: Obtener todos los alumnos (con manejo de errores)
export const getAllAlumnos = async () => {
  try {
    const response = await api.get('/secretarios/alumnos/');
    return response;
  } catch (error) {
    console.error('❌ [API] Error obteniendo todos los alumnos:', error);
    return { data: [] };
  }
};

// Listar todas las incidencias (con filtros opcionales)
export const getIncidencias = async (filtros = {}) => {
  try {
    console.log('🔍 Obteniendo incidencias con filtros:', filtros);
    
    // ✅ USAR LA RUTA QUE SÍ EXISTE: /preceptores_rectores/medidas/
    const response = await api.get('/preceptores_rectores/medidas/');
    
    let medidas = response.data;
    
    // ✅ APLICAR FILTROS EN EL FRONTEND (ya que el backend no tiene la ruta de filtros)
    if (filtros.dni_alumno) {
      medidas = medidas.filter(medida => 
        medida.id_alumno?.dni_alumno?.includes(filtros.dni_alumno)
      );
    }
    
    // Si necesitas filtrar por grado, necesitarías obtener los alumnos primero
    if (filtros.id_grado) {
      console.warn('⚠️ Filtro por grado no disponible sin endpoint específico');
      // Para filtrar por grado necesitarías una relación alumno-grado
    }
    
    console.log('✅ Incidencias obtenidas:', medidas.length);
    return { data: { results: medidas } };
    
  } catch (error) {
    console.error('❌ Error obteniendo incidencias:', error);
    throw new Error('No se pudieron cargar las incidencias: ' + error.message);
  }
};

// Obtener detalle de una incidencia
export const getIncidenciaById = async (id_medida) => {
  try {
    const response = await api.get(`/preceptores_rectores/incidencias/${id_medida}/`);
    return response;
  } catch (error) {
    console.error('❌ Error obteniendo detalle de incidencia:', error);
    throw error;
  }
};

// Obtener grados (si no los tienes)
export const getGrados = async () => {
  try {
    const response = await api.get('/secretarios/grados/');
    return response;
  } catch (error) {
    console.error('❌ Error obteniendo grados:', error);
    throw error;
  }
};

export const getTiposIncidenciasCompleto = async () => {
  try {
    const response = await api.get('/preceptores_rectores/tipos-incidencias-completo/');
    return response;
  } catch (error) {
    console.error('❌ Error obteniendo tipos de incidencias:', error);
    throw error;
  }
};

// Obtener incidencias por tipo
export const getIncidenciasPorTipo = async (idTipoIncidencia) => {
  try {
    const response = await api.get(`/preceptores_rectores/incidencias-por-tipo/${idTipoIncidencia}/`);
    return response;
  } catch (error) {
    console.error('❌ Error obteniendo incidencias por tipo:', error);
    throw error;
  }

};
export default api;