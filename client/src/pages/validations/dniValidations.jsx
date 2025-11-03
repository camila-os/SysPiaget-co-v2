// src/validations/dniValidations.js
import { verificarDniAlumno } from '../../api/secretario.api';
import { validarDniAlumnoLogic } from './dniValidationLogic.jsx';

// Función base para validar formato (reutilizable)
const validateDNIFormatoBase = (value) => {
  if (!value) return "DNI requerido";
  
  const dniStr = value.toString().trim();
  
  // Verificar que solo contenga números
  if (!/^\d+$/.test(dniStr)) {
    return "El DNI solo puede contener números";
  }
  
  // Verificar que no empiece con 0
  if (dniStr.startsWith('0')) {
    return "El DNI no puede empezar con 0";
  }
  
  // Verificar longitud exacta de 8 dígitos
  if (dniStr.length !== 8) {
    return "El DNI debe tener exactamente 8 dígitos";
  }
  
  // Convertir a número para verificar rango
  const dniNum = parseInt(dniStr, 10);
  if (dniNum < 10000000 || dniNum > 99999999) {
    return "El DNI debe tener exactamente 8 dígitos";
  }
  
  return true;
};

// Validación completa (formato + duplicados) - ASINCRONA
export const validateDNI = async (value) => {
  // Primero validar formato
  const formatoValido = validateDNIFormatoBase(value);
  if (formatoValido !== true) return formatoValido;

  // Si el formato es válido, verificar duplicados
  try {
    const dniNum = parseInt(value.toString().trim(), 10);
    const respuesta = await verificarDniAlumno(dniNum);
    
    if (respuesta.data.existe) {
      return "Este DNI ya está registrado para otro alumno";
    }
  } catch (error) {
    console.error('Error verificando DNI duplicado:', error);
    return "Error verificando disponibilidad del DNI";
  }
  
  return true;
};

// Validación solo de formato - SINCRONA
export const validateDNIFormato = (value) => {
  return validateDNIFormatoBase(value);
};

export const dniInputProps = {
  type: "text",
  placeholder: "8 dígitos sin puntos", 
  maxLength: "8",
  onInput: (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
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

// ✅ NUEVAS EXPORTACIONES:

// Validación SUPER COMPLETA (formato + todas las validaciones de negocio)
export const validateDNICompletoAlumno = async (value) => {
  // Primero validar formato
  const formatoValido = validateDNIFormatoBase(value);
  if (formatoValido !== true) return formatoValido;

  // Luego validar todas las reglas de negocio
  try {
    const errores = await validarDniAlumnoLogic(value);
    if (errores.length > 0) {
      return errores[0];
    }
  } catch (error) {
    console.error('Error en validación completa DNI:', error);
    return "Error verificando el DNI";
  }
  
  return true;
};

// Validación SUPER COMPLETA para alumno
export const dniValidationRulesCompletoAlumno = {
  required: "DNI requerido",
  validate: validateDNICompletoAlumno
};