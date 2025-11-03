import { validateName, nameValidationRules, nameInputProps } from './nameValidations.jsx';
import { 
  dniValidationRules, 
  dniInputProps,
  dniValidationRulesFormato 
} from './dniTutorValidations.jsx';
import { 
  phoneValidationRules, 
  phoneInputProps,
  createPhoneValidationForTutor 
} from './telefonoValidations.jsx';
import { 
  emailValidationRules, 
  emailInputProps,
  createEmailValidationForTutor 
} from './correoValidations.jsx';

// Validación para género
export const validateGender = (value) => {
  if (!value) return "Debe seleccionar un género";
  return true;
};

// Reglas base (solo validaciones de formato)
export const tutorValidationRulesBase = {
  dni_tutor: dniValidationRulesFormato,
  nombre_tutor: nameValidationRules,
  apellido_tutor: {
    required: "El apellido es requerido",
    validate: (value) => validateName(value, "apellido")
  },
  genero_tutor: {
    required: "Debe seleccionar un género",
    validate: validateGender
  },
  telefono_tutor: phoneValidationRules,
  correo_tutor: emailValidationRules
};

// Reglas con verificación de duplicados (ASINCRONAS)
export const tutorValidationRulesCompletas = {
  dni_tutor: dniValidationRules,
  nombre_tutor: nameValidationRules,
  apellido_tutor: {
    required: "El apellido es requerido",
    validate: (value) => validateName(value, "apellido")
  },
  genero_tutor: {
    required: "Debe seleccionar un género",
    validate: validateGender
  },
  telefono_tutor: phoneValidationRules,
  correo_tutor: emailValidationRules
};

// Exportar todos los input props
export { 
  nameInputProps, 
  dniInputProps, 
  phoneInputProps, 
  emailInputProps 
};