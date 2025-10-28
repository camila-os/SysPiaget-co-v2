// src/validations/dateValidations.js

// Función segura para convertir "YYYY-MM-DD" a Date sin errores por zona horaria
export const parseFechaLocal = (value) => {
  if (!value) return null;
  
  // Si ya es un objeto Date, retornarlo directamente
  if (value instanceof Date) return value;
  
  // Si es string en formato YYYY-MM-DD
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day); // mes base 0, hora local
  }
  
  return null;
};

// Función auxiliar para calcular edad (sin depender de zona horaria)
export const calcularEdad = (fechaNacimiento) => {
  const fecha = parseFechaLocal(fechaNacimiento);
  if (!fecha || isNaN(fecha.getTime())) return 0;

  const hoy = new Date();
  let edad = hoy.getFullYear() - fecha.getFullYear();

  const mesActual = hoy.getMonth();
  const mesNacimiento = fecha.getMonth();
  const diaActual = hoy.getDate();
  const diaNacimiento = fecha.getDate();

  if (mesActual < mesNacimiento || (mesActual === mesNacimiento && diaActual < diaNacimiento)) {
    edad--;
  }

  return edad;
};

// Función para obtener fecha mínima (19 años atrás)
export const getFechaMinima = () => {
  const hoy = new Date();
  const fecha = new Date(hoy.getFullYear() - 19, hoy.getMonth(), hoy.getDate());
  return fecha.toISOString().split('T')[0];
};

// Función para obtener fecha máxima (12 años atrás)
export const getFechaMaxima = () => {
  const hoy = new Date();
  const fecha = new Date(hoy.getFullYear() - 12, hoy.getMonth(), hoy.getDate());
  return fecha.toISOString().split('T')[0];
};

// Función para verificar si la edad es válida
export const isEdadValida = (edad) => {
  return edad >= 12 && edad <= 19;
};

// Función para mostrar rango de años permitido
export const getRangoAniosPermitido = () => {
  const anioActual = new Date().getFullYear();
  return {
    min: anioActual - 19,
    max: anioActual - 12,
    rango: "12 - 19 años"
  };
};

// Estado completo de edad para componentes
export const getEstadoEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) {
    return { 
      edad: null, 
      esValida: null,
      mensaje: "Seleccione una fecha" 
    };
  }

  const fecha = parseFechaLocal(fechaNacimiento);
  if (!fecha || isNaN(fecha.getTime())) {
    return {
      edad: 0,
      esValida: false,
      mensaje: "Fecha no válida"
    };
  }

  const edad = calcularEdad(fecha);
  const esValida = isEdadValida(edad);

  let mensaje = "";
  if (edad < 12) {
    mensaje = "Edad insuficiente (mínimo 12 años)";
  } else if (edad > 19) {
    mensaje = "Edad excedida (máximo 19 años)";
  } else {
    mensaje = "Edad válida";
  }

  return { edad, esValida, mensaje };
};

// Validación estricta que previene manipulación del HTML
export const validateFechaNacimientoEstricta = (value) => {
  if (!value) return "La fecha de nacimiento es requerida";

  // Verificar formato básico
  if (!value.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return "Formato de fecha inválido";
  }

  const fechaNacimiento = parseFechaLocal(value);
  
  // Validar que sea una fecha válida
  if (!fechaNacimiento || isNaN(fechaNacimiento.getTime())) {
    return "La fecha de nacimiento no es válida";
  }

  // Validar que la fecha convertida coincida con el input
  const [year, month, day] = value.split('-').map(Number);
  if (fechaNacimiento.getFullYear() !== year || 
      fechaNacimiento.getMonth() + 1 !== month || 
      fechaNacimiento.getDate() !== day) {
    return "Fecha no válida";
  }

  // Validar que no sea futura
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // Normalizar a inicio del día
  
  if (fechaNacimiento > hoy) {
    return "La fecha de nacimiento no puede ser futura";
  }

  // Calcular edad
  const edad = calcularEdad(fechaNacimiento);

  // Validar rango de edad
  if (edad < 12) {
    return `El alumno debe tener al menos 12 años (actual: ${edad} años)`;
  }

  if (edad > 19) {
    return `El alumno no puede tener más de 19 años (actual: ${edad} años)`;
  }

  return true;
};

// Props para input de fecha
export const fechaNacimientoInputProps = {
  type: "date",
  max: getFechaMaxima(),
  min: getFechaMinima(),
  onInput: (e) => {
    const fecha = parseFechaLocal(e.target.value);
    const hoy = new Date();

    if (fecha && fecha > hoy) {
      e.target.setCustomValidity("No se permiten fechas futuras");
    } else {
      e.target.setCustomValidity("");
    }
  }
};

// Reglas para React Hook Form
export const fechaNacimientoValidationRules = {
  required: "La fecha de nacimiento es requerida",
  validate: validateFechaNacimientoEstricta
};

// Función para obtener el mensaje de estado de edad (para mostrar en UI)
export const getMensajeEstadoEdad = (fechaNacimiento) => {
  const estado = getEstadoEdad(fechaNacimiento);
  return {
    mensaje: estado.mensaje,
    esValido: estado.esValida,
    edad: estado.edad
  };
};


