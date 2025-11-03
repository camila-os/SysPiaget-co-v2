// En dniTutorValidations.jsx - SOLUCIÓN RÁPIDA
import { verificarDniTutor } from '../../api/secretario.api'; // ← AGREGAR ESTO
import { validarDniTutorLogic } from './dniValidationLogic';


// Función base para validar formato (reutilizable)
const validateDNIFormatoBase = (value) => {
  if (!value) return "DNI requerido";
  
  const dniStr = value.toString().trim();
  
  // Si está vacío después de trim, mostrar error requerido
  if (dniStr === '') return "DNI requerido";
  
  // Verificar que solo contenga números
  if (!/^\d+$/.test(dniStr)) {
    return "El DNI solo puede contener números";
  }
  
  // Verificar que no empiece con 0
  if (dniStr.startsWith('0')) {
    return "El DNI no puede empezar con 0";
  }
  
  // Verificar longitud entre 7 y 8 dígitos
  if (dniStr.length < 7 || dniStr.length > 8) {
    return "El DNI debe tener entre 7 y 8 dígitos";
  }
  
  // Convertir a número para verificar rango
  const dniNum = parseInt(dniStr, 10);
  if (dniNum < 1000000 || dniNum > 99999999) {
    return "El DNI debe tener entre 7 y 8 dígitos";
  }
  
  return true;
};

// Validación completa (formato + duplicados) - ASINCRONA
export const validateDNI = async (value) => {
  // Si está vacío, no validar duplicados
  if (!value || value.toString().trim() === '') {
    return "DNI requerido";
  }
  
  // Primero validar formato
  const formatoValido = validateDNIFormatoBase(value);
  if (formatoValido !== true) return formatoValido;

  // Si el formato es válido, verificar duplicados
  try {
    const dniNum = parseInt(value.toString().trim(), 10);
    const respuesta = await verificarDniTutor(dniNum);
    
    if (respuesta.data.existe) {
      return "Este DNI ya está registrado para otro tutor";
    }
  } catch (error) {
    console.error('Error verificando DNI duplicado:', error);
    return "Error verificando disponibilidad del DNI";
  }
  
  return true;
};

// Validación SUPER COMPLETA (formato + todas las validaciones de negocio)
export const validateDNICompletoTutor = async (value, alumnoDni = null) => {
  // Primero validar formato
  const formatoValido = validateDNIFormatoBase(value);
  if (formatoValido !== true) return formatoValido;

  // Luego validar todas las reglas de negocio
  try {
    const errores = await validarDniTutorLogic(value, alumnoDni);
    if (errores.length > 0) {
      return errores[0];
    }
  } catch (error) {
    console.error('Error en validación completa DNI tutor:', error);
    return "Error verificando el DNI";
  }
  
  return true;
};

// Validación solo de formato - SINCRONA
export const validateDNIFormato = (value) => {
  return validateDNIFormatoBase(value);
};

// Mejorar los input props para prevenir letras
export const dniInputProps = {
  type: "text",
  placeholder: "7-8 dígitos sin puntos", 
  maxLength: "8",
  onInput: (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
    
    if (e.target.value.length > 8) {
      e.target.value = e.target.value.slice(0, 8);
    }
  },
  onKeyPress: (e) => {
    const charCode = e.which ? e.which : e.keyCode;
    if (charCode < 48 || charCode > 57) {
      e.preventDefault();
      return false;
    }
    return true;
  }
};

// Para validación completa (formato + duplicados) - ASINCRONA
export const dniValidationRules = {
  required: "DNI requerido",
  validate: validateDNI
};

// Para validación solo de formato - SINCRONA
export const dniValidationRulesFormato = {
  required: "DNI requerido",
  validate: validateDNIFormato
};

// Validación SUPER COMPLETA para tutor
export const dniValidationRulesCompletoTutor = (alumnoDni = null) => {
  return {
    required: "DNI requerido",
    validate: (value) => validateDNICompletoTutor(value, alumnoDni)
  };
};