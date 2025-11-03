import { 
  verificarDniAlumno, 
  verificarDniTutor, 
  verificarDniEmpleado 
} from '../../api/secretario.api';

/**
 * LÓGICA DE VALIDACIÓN DE DNI - FUNCIONES PURAS
 * Separadas de las reglas de react-hook-form
 */

// ✅ LÓGICA PARA ALUMNO
export const validarDniAlumnoLogic = async (dni) => {
  const errores = [];
  
  try {
    // Verificar contra tabla de tutores
    const tutorResp = await verificarDniTutor(dni);
    if (tutorResp.data.existe) {
      const tutor = tutorResp.data.tutor_data;
      errores.push(`El DNI se encuentra ocupado.`);
    }
    
    // Verificar contra tabla de empleados
    const empleadoResp = await verificarDniEmpleado(dni);
    if (empleadoResp.data.existe) {
      errores.push("DNI inválido..");
    }
    
    // Verificar duplicado en alumnos
    const alumnoResp = await verificarDniAlumno(dni);
    if (alumnoResp.data.existe) {
      errores.push("DNI inválido.");
    }
    
  } catch (error) {
    console.error('Error en validación DNI alumno:', error);
    errores.push("Error al verificar el DNI. Intente nuevamente.");
  }
  
  return errores;
};

// ✅ LÓGICA PARA TUTOR
export const validarDniTutorLogic = async (dni, alumnoDni = null) => {
  const errores = [];
    
  try {
    // Verificar que no sea igual al DNI del alumno (estado local)
    if (alumnoDni && parseInt(dni) === parseInt(alumnoDni)) {
      errores.push("DNI inválido");
    }
    
    // Verificar contra tabla de alumnos
    const alumnoResp = await verificarDniAlumno(dni);
    if (alumnoResp.data.existe) {
      errores.push("DNI inválido.");
    }
    
    // Verificar contra tabla de empleados
    const empleadoResp = await verificarDniEmpleado(dni);
    if (empleadoResp.data.existe) {
      errores.push("DNI inválido.");
    }
    
    // Verificar duplicado en tutores
    const tutorResp = await verificarDniTutor(dni);
    if (tutorResp.data.existe && tutorResp.data.activo) {
      const tutor = tutorResp.data.tutor_data;
      errores.push(`DNI inválido`);
    }
    
  } catch (error) {
    console.error('Error en validación DNI tutor:', error);
    errores.push("Error al verificar el DNI. Intente nuevamente.");
  }
  
  return errores;
};

// ✅ FUNCIÓN PARA VERIFICACIÓN RÁPIDA (útil para onSubmit)
export const verificarDniCompleto = async (dni, tipo, alumnoDni = null) => {
  let errores = [];
  
  if (tipo === 'alumno') {
    errores = await validarDniAlumnoLogic(dni);
  } else if (tipo === 'tutor') {
    errores = await validarDniTutorLogic(dni, alumnoDni);
  }
  
  return {
    valido: errores.length === 0,
    errores: errores
  };
};