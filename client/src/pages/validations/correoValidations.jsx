export const validateEmailFormat = (value) => {
  if (!value) return "El email es requerido";
  const email = String(value).trim().toLowerCase();
  
  if (email.length > 100) {
    return "El email no puede tener más de 100 caracteres";
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Formato de email inválido. Ej: usuario@dominio.com";
  }
  
  // Validar partes del email
  const [localPart, domain] = email.split('@');
  
  if (localPart.length === 0) {
    return "La parte local del email no puede estar vacía";
  }
  
  if (domain.length === 0) {
    return "El dominio del email no puede estar vacío";
  }
  
  if (!domain.includes('.')) {
    return "El dominio debe contener un punto (.)";
  }
  
  return true;
};

export const emailInputProps = {
  type: "email", 
  placeholder: "Ej: tutor@email.com",
  maxLength: 100,
  onInput: (e) => e.target.value = e.target.value.toLowerCase(),
  onBlur: (e) => {
    // Limpia espacios al salir del campo
    e.target.value = e.target.value.trim().toLowerCase();
  }
};

export const emailValidationRules = {
  required: "El email es requerido",
  validate: validateEmailFormat
};

// Los emails pueden repetirse para el mismo tutor
export const createEmailValidationForTutor = (existingEmails = [], currentEmail = null) => {
  return validateEmailFormat;
};