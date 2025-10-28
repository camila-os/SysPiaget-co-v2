import React from 'react';
import { useForm } from 'react-hook-form';
import Button from "../../components/Buttons/Buttons";
import { 
  tutorValidationRulesCompletas,
  nameInputProps, 
  dniInputProps, 
  phoneInputProps, 
  emailInputProps 
} from "../validations/tutorValidations.jsx";

function FormTutorNuevoSimple({ loading, serverErrors, onVolver, onSubmit }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    mode: "onChange", // Cambiar a onChange para validación más suave
    reValidateMode: "onChange"
  });

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit(onSubmit)} className='alumno-form'>
        <div className="form-grid">
          {/* DNI */}
          <div className="form-group">
            <label className="form-label">DNI del Tutor *</label>
            <input
              className={`form-input ${errors.dni_tutor ? 'error' : ''}`}
              {...register("dni_tutor", tutorValidationRulesCompletas.dni_tutor)}
              {...dniInputProps}
              disabled={loading}
            />
            {errors.dni_tutor && <span className="error">{errors.dni_tutor.message}</span>}
            {serverErrors?.dni_tutor && <span className="error">{serverErrors.dni_tutor[0]}</span>}
          </div>

          {/* Nombre */}
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input
              className={`form-input ${errors.nombre_tutor ? 'error' : ''}`}
              {...register("nombre_tutor", tutorValidationRulesCompletas.nombre_tutor)}
              {...nameInputProps}
              disabled={loading}
            />
            {errors.nombre_tutor && <span className="error">{errors.nombre_tutor.message}</span>}
            {serverErrors?.nombre_tutor && <span className="error">{serverErrors.nombre_tutor[0]}</span>}
          </div>

          {/* Apellido */}
          <div className="form-group">
            <label className="form-label">Apellido *</label>
            <input
              className={`form-input ${errors.apellido_tutor ? 'error' : ''}`}
              {...register("apellido_tutor", tutorValidationRulesCompletas.apellido_tutor)}
              {...nameInputProps}
              placeholder="Ej: Pérez"
              disabled={loading}
            />
            {errors.apellido_tutor && <span className="error">{errors.apellido_tutor.message}</span>}
            {serverErrors?.apellido_tutor && <span className="error">{serverErrors.apellido_tutor[0]}</span>}
          </div>
          
          {/* Género */}
          <div className="form-group">
            <label className="form-label">Género *</label>
            <select 
              className={`form-select ${errors.genero_tutor ? 'error' : ''}`}
              {...register("genero_tutor", tutorValidationRulesCompletas.genero_tutor)}
              disabled={loading}
            >
              <option value="">-- Seleccionar --</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
            {errors.genero_tutor && <span className="error">{errors.genero_tutor.message}</span>}
            {serverErrors?.genero_tutor && <span className="error">{serverErrors.genero_tutor[0]}</span>}
          </div>

          {/* Teléfono */}
          <div className="form-group">
            <label className="form-label">Teléfono *</label>
            <input
              className={`form-input ${errors.telefono_tutor ? 'error' : ''}`}
              {...register("telefono_tutor", tutorValidationRulesCompletas.telefono_tutor)}
              {...phoneInputProps}
              disabled={loading}
            />
            {errors.telefono_tutor && <span className="error">{errors.telefono_tutor.message}</span>}
            {serverErrors?.telefono_tutor && <span className="error">{serverErrors.telefono_tutor[0]}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              className={`form-input ${errors.correo_tutor ? 'error' : ''}`}
              {...register("correo_tutor", tutorValidationRulesCompletas.correo_tutor)}
              {...emailInputProps}
              disabled={loading}
            />
            {errors.correo_tutor && <span className="error">{errors.correo_tutor.message}</span>}
            {serverErrors?.correo_tutor && <span className="error">{serverErrors.correo_tutor[0]}</span>}
          </div>
        </div>

        <div className="form-actions">  
          <Button variant="cancel" type="outline" onClick={onVolver} disabled={loading || isSubmitting}>
            Cancelar
          </Button>
          <Button variant="next" type="solid" onClick={handleSubmit(onSubmit)} disabled={loading || isSubmitting || Object.keys(errors).length > 0}>
            {loading || isSubmitting ? 'Registrando...' : 'Registrar Tutor'}
          </Button>
        </div>  
      </form>
    </div>
  );
}

export default FormTutorNuevoSimple;