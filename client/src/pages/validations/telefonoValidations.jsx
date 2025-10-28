export const validatePhoneFormat = (value) => {
  if (!value) return "El teléfono es requerido";
  const phone = String(value).trim();
  
  if (phone.length < 8) {
    return "El teléfono debe tener al menos 8 caracteres";
  }
  
  if (phone.length > 20) {
    return "El teléfono no puede tener más de 20 caracteres";
  }
  
  // Permite números, espacios, +, -, (, )
  if (!/^[\d\s+\-()]+$/.test(phone)) {
    return "Formato de teléfono inválido. Use solo números, espacios y + - ( )";
  }
  
  // Debe tener al menos 8 dígitos (sin contar símbolos)
  const digitCount = phone.replace(/\D/g, '').length;
  if (digitCount < 8) {
    return "El teléfono debe tener al menos 8 dígitos";
  }
  
  return true;
};

export const phoneInputProps = {
  type: "tel", 
  placeholder: "Ej: +54 11 1234-5678",
  maxLength: 20,
  onInput: (e) => e.target.value = e.target.value.replace(/[^\d\s+\-()]/g, '')
};

export const phoneValidationRules = {
  required: "El teléfono es requerido",
  validate: validatePhoneFormat
};

// Los teléfonos pueden repetirse para el mismo tutor
export const createPhoneValidationForTutor = (existingPhones = [], currentPhone = null) => {
  return validatePhoneFormat;
};