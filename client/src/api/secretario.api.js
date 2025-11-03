
import api from './auth.api';

// ALUMNOS
export const getAllAlumnos = () => api.get('/secretarios/alumnos/');

export const getAlumnoByDni = async (dni_alumno) => {
  try {
    const response = await api.get(`/secretarios/alumnos/${dni_alumno}/`);
    return response;
  } catch (error) {
    if (error.response?.status === 404 || error.message?.includes('Alumno no encontrado')) {
      return { data: null };
    }
    throw error;
  }
};

export const verificarDniAlumno = async (dni_alumno) => {
  try {
    const response = await api.get(`/secretarios/alumnos/verificar-dni/${dni_alumno}/`);
    return response;
  } catch (error) {
    throw error;
  }
};
// VERIFICACIÓN DE EMPLEADOS - AGREGAR ESTA FUNCIÓN
export const verificarDniEmpleado = async (dni) => {
  try {
    const response = await api.get(`/secretarios/empleados/verificar-dni/${dni}/`);
    return response;
  } catch (error) {
    // Si no existe el endpoint, asumimos que no hay empleado
    if (error.response?.status === 404) {
      return { 
        data: { 
          existe: false,
          mensaje: 'DNI disponible (empleado no encontrado)'
        } 
      };
    }
    throw error;
  }
};

export const updateAlumno = (id_alumno, alumnoData) => api.put(`/secretarios/alumnos/update/${id_alumno}/`, alumnoData);
export const desactivarAlumnoByDni = (dni_alumno) => api.patch(`/secretarios/alumnos/${dni_alumno}/desactivar/`);
export const activarAlumnoByDni = (dni_alumno) => api.patch(`/secretarios/alumnos/${dni_alumno}/activar/`);
export const getAlumnoById = (id_alumno) => api.get(`/secretarios/alumnos/id/${id_alumno}/`);
export const getAlumnoCompletoByDni = (dni_alumno) => api.get(`/secretarios/alumnos/${dni_alumno}/completo/`);
export const createAlumnoCompleto = (data) => api.post('/secretarios/alumno-completo/', data);

// TARJETA
export const getAlumnosLista = () => api.get('/secretarios/alumnos/');
export const getTutoresLista = () => api.get('/secretarios/tutores/');

// GRADOS Y COLEGIOS
export const getAllGrados = () => api.get('/secretarios/grados/');
export const getAllColegios = () => api.get('/secretarios/colegios/');
export const createColegio = (colegioData) => api.post('/secretarios/colegios/crear/', colegioData);

// RELACIONES ALUMNO-GRADO
export const createAlumnoXGrado = (relacionData) => api.post('/secretarios/alumnos-x-grado/', relacionData);
export const getAlumnoXGradoByAlumnoId = (id_alumno) => api.get(`/secretarios/alumnos-x-grado/${id_alumno}/`);
export const getAlumnosXGradoByAlumnoDni = (dni_alumno) => api.get(`/secretarios/alumnos-x-grado/dni/${dni_alumno}/`);
export const updateAlumnoXGrado = (id_alumno_x_grado, relacionData) => api.put(`/secretarios/alumnos-x-grado/update/${id_alumno_x_grado}/`, relacionData);
export const updateGradoAlumnoByDni = (dni_alumno, data) => api.put(`/secretarios/alumnos/${dni_alumno}/cambiar-grado/`, data);

// TUTORES
export const verificarDniTutor = async (dni_tutor) => {
  try {
    const response = await api.get(`/secretarios/tutores/verificar-dni/${dni_tutor}/`);
    return response;
  } catch (error) {
    if (error.response?.status === 404) {
      return { 
        data: { 
          existe: false,
          activo: false,
          mensaje: 'DNI disponible'
        } 
      };
    }
    throw error;
  }
};

export const verificarEmailTutor = async (email) => {
  try {
    const response = await api.get(`/secretarios/tutores/verificar-email/?email=${email}`);
    return response;
  } catch (error) {
    if (error.response?.status === 404) {
      return { 
        data: { 
          existe: false,
          activo: false,
          mensaje: 'Email disponible'
        } 
      };
    }
    throw error;
  }
};

export const verificarTelefonoTutor = async (telefono) => {
  try {
    const response = await api.get(`/secretarios/tutores/verificar-telefono/?telefono=${telefono}`);
    return response;
  } catch (error) {
    if (error.response?.status === 404) {
      return { 
        data: { 
          existe: false,
          activo: false,
          mensaje: 'Teléfono disponible'
        } 
      };
    }
    throw error;
  }
};

export const getAllTutores = async () => {
  try {
    const response = await api.get('/secretarios/tutores/');
    const tutoresActivos = Array.isArray(response.data)
      ? response.data.filter(tutor => tutor.estado_tutor === 'Activo')
      : [];
    return { ...response, data: tutoresActivos };
  } catch (error) {
    throw error;
  }
};

export const getTutorById = (id_tutor) => api.get(`/secretarios/tutores/${id_tutor}/`);

export const verificarTutorActivoByDni = async (dni_tutor) => {
  try {
    const response = await api.get(`/secretarios/tutores/dni/${dni_tutor}/`);
    if (response.data.estado_tutor !== 'Activo') {
      return { 
        data: null, 
        existe: false,
        activo: false,
        mensaje: 'Tutor inactivo',
        tutorInactivo: response.data
      };
    }
    return { 
      data: response.data, 
      existe: true,
      activo: true,
      mensaje: 'Tutor activo encontrado'
    };
  } catch (error) {
    if (error.response?.status === 404 || error.message?.includes('Tutor no encontrado')) {
      return { 
        data: null, 
        existe: false,
        activo: false,
        mensaje: 'Tutor no encontrado - DNI disponible'
      };
    }
    throw error;
  }
};

export const getTutorByDni = async (dni_tutor) => {
  try {
    const response = await api.get(`/secretarios/tutores/dni/${dni_tutor}/`);
    return response;
  } catch (error) {
    if (error.response?.status === 404 || error.message?.includes('Tutor no encontrado')) {
      return { data: null };
    }
    throw error;
  }
};

export const getTutorCompleto = (id_tutor) => api.get(`/secretarios/tutores/${id_tutor}/completo/`);
export const createTutores = (tutorData) => api.post('/secretarios/tutores/crear/', tutorData);
export const updateTutor = (id_tutor, tutorData) => api.put(`/secretarios/tutores/update/${id_tutor}/`, tutorData);
export const desactivarTutorByDni = (dni_tutor) => api.patch(`/secretarios/tutores/dni/${dni_tutor}/desactivar/`);
export const activarTutorByDni = (dni_tutor) => api.patch(`/secretarios/tutores/dni/${dni_tutor}/activar/`);

// PARENTESCOS
export const getAllParentesco = () => api.get('/secretarios/parentescos/');
export const crearParentesco = async (parentescoData) => {
  const response = await api.post('secretarios/parentescos/crear/', parentescoData);
  return response;
};


// RELACIONES ALUMNO-TUTOR
export const createAlumnoXTutor = (relacionData) => api.post('/secretarios/alumnos-x-tutor/', relacionData);
export const getAlumnoXTutorByAlumnoId = (id_alumno) => api.get(`/secretarios/alumnos-x-tutor/${id_alumno}/`);
export const getAlumnosXTutorByAlumnoDni = (dni_alumno) => api.get(`/secretarios/alumnos-x-tutor/dni/${dni_alumno}/`);
export const updateAlumnoXTutor = (id_alumno_x_tutor, relacionData) => api.put(`/secretarios/alumnos-x-tutor/update/${id_alumno_x_tutor}/`, relacionData);
export const updateParentescoAlumnoTutor = (dniAlumno, data) => api.put(`/secretarios/alumnos/${dniAlumno}/cambiar-parentesco/`, data);
export const deleteAlumnoXTutor = (id_alumno_x_tutor) => api.delete(`/secretarios/alumnos-x-tutor/delete/${id_alumno_x_tutor}/`);
export const getAlumnoXTutorByAlumnoDni = (dniAlumno) => api.get(`/secretarios/alumnos-x-tutor/dni/${dniAlumno}/`);

// ACTIVACIÓN COMPLETA
export const activarAlumnoCompleto = async (dni_alumno) => {
  try {
    const response = await api.patch(`/secretarios/alumnos/${dni_alumno}/activar-completo/`);
    return response;
  } catch (error) {
    throw error;
  }
};

export default api;