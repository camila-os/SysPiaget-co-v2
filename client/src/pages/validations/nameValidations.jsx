// src/validations/nameValidations.js

// Validación para nombres y apellidos
export const validateNameBase = (value, field = "nombre") => {
  if (!value) return `El ${field} es requerido`;

  const nameTrimmed = String(value).trim();

  if (nameTrimmed.length === 0) {
    return `El ${field} no puede estar vacío o contener solo espacios`;
  }

  if (nameTrimmed.length < 2) {
    return `El ${field} debe tener al menos 2 caracteres`;
  }

  if (nameTrimmed.length > 20) {
    return `El ${field} no puede tener más de 20 caracteres`;
  }

  // Verifica que haya al menos una letra
  const hasLetters = /[A-Za-zÁáÉéÍíÓóÚúÑñ]/.test(nameTrimmed);
  if (!hasLetters) {
    return `El ${field} debe contener letras válidas`;
  }

  // Solo letras y espacios - BLOQUEA NÚMEROS Y SÍMBOLOS
  const regex = /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/;
  if (!regex.test(nameTrimmed)) {
    return `El ${field} solo puede contener letras y espacios. No se permiten números ni símbolos`;
  }

  // Evitar espacios múltiples
  if (/\s{2,}/.test(nameTrimmed)) {
    return `El ${field} no puede tener múltiples espacios consecutivos`;
  }

  return true;
};

// Validación principal
export const validateName = (value) => {
  return validateNameBase(value, "nombre");
};

// Props para inputs - BLOQUEA TECLAS DE NÚMEROS Y SÍMBOLOS
export const nameInputProps = {
  type: "text",
  placeholder: "Ej: Matías",
  maxLength: 20,
  onInput: (e) => {
    // Reemplaza múltiples espacios por uno solo
    e.target.value = e.target.value.replace(/\s{2,}/g, ' ');
  },
  onKeyPress: (e) => {
    // Solo permite letras, espacios y teclas de control
    const key = e.key;
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 
      'ArrowLeft', 'ArrowRight', 'Home', 'End'
    ];
    
    // Permite letras, espacios y teclas de control
    const isLetter = /[A-Za-zÁáÉéÍíÓóÚúÑñ\s]/.test(key);
    const isControlKey = allowedKeys.includes(key);
    
    if (!isLetter && !isControlKey) {
      e.preventDefault();
    }
  },
  onPaste: (e) => {
    // Valida el contenido pegado
    const pastedText = e.clipboardData.getData('text');
    const regex = /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]*$/;
    
    if (!regex.test(pastedText)) {
      e.preventDefault();
      alert('Solo se permiten letras y espacios');
    }
  }
};

// Reglas para React Hook Form
export const nameValidationRules = {
  required: "El nombre es requerido",
  validate: validateName
};