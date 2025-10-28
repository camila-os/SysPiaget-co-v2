import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createTutores } from '../../api/secretario.api';
import Button from "../../components/Buttons/Buttons";
import BuscadorParentescos from './BuscadorParentescos';
import CrearParentescoModal from './CrearParentescoModal';
import { 
  tutorValidationRulesCompletas,
  nameInputProps, 
  dniInputProps, 
  phoneInputProps, 
  emailInputProps 
} from "../validations/tutorValidations.jsx";

function FormTutorNuevo({ 
    parentescos, 
    loading, 
    serverErrors, 
    onVolver, 
    onSubmit 
}) {
    const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, trigger, watch } = useForm({
      mode: "onChange", // Cambiar a onChange para validación más suave
      reValidateMode: "onChange"
    });
    const [mostrarModalParentesco, setMostrarModalParentesco] = useState(false);
    const [creandoTutor, setCreandoTutor] = useState(false);

    const handleParentescoCreado = async (parentescoCreado) => {
        try {
            setValue('id_parentesco', parentescoCreado.id_parentesco, { shouldValidate: true });
            await trigger('id_parentesco');
            setMostrarModalParentesco(false);
        } catch (error) {
            console.error('Error al seleccionar parentesco creado:', error);
        }
    };

    const handleSubmitTutorNuevo = async (data) => {
        try {
            setCreandoTutor(true);

            const nombreTrimmed = data.nombre_tutor?.trim() || '';
            const apellidoTrimmed = data.apellido_tutor?.trim() || '';
            const telefonoTrimmed = data.telefono_tutor?.trim() || '';

            const tutorDataForAPI = {
                dni_tutor: parseInt(data.dni_tutor, 10),
                nombre_tutor: nombreTrimmed,
                apellido_tutor: apellidoTrimmed,
                genero_tutor: data.genero_tutor,
                telefono_tutor: telefonoTrimmed,
                correo_tutor: data.correo_tutor.trim().toLowerCase(),
                estado_tutor: 'Activo',
                primer_login: true
            };
            
            try {
                const tutorResponse = await createTutores(tutorDataForAPI);
                const tutorId = tutorResponse.data.id_tutor;
                
                onSubmit({
                    ...data,
                    tutorId: tutorId
                });
                
            } catch (tutorError) {
                if (tutorError.response?.status === 400) {
                    throw tutorError;
                } else {
                    alert('❌ Error al crear tutor');
                }
            }
        } catch (error) {
            throw error;
        } finally {
            setCreandoTutor(false);
        }
    };

    const estaCargando = loading || creandoTutor || isSubmitting;

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit(handleSubmitTutorNuevo)} className='alumno-form'>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">DNI del Tutor *</label>
                        <input
                            className={`form-input ${errors.dni_tutor ? 'error' : ''}`}
                            {...register("dni_tutor", tutorValidationRulesCompletas.dni_tutor)}
                            {...dniInputProps}
                            disabled={estaCargando}
                        />
                        {errors.dni_tutor && <span className="error">{errors.dni_tutor.message}</span>}
                        {serverErrors?.dni_tutor && <span className="error">{serverErrors.dni_tutor[0]}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Nombre *</label>
                        <input
                            className={`form-input ${errors.nombre_tutor ? 'error' : ''}`}
                            {...register("nombre_tutor", tutorValidationRulesCompletas.nombre_tutor)}
                            {...nameInputProps}
                            disabled={estaCargando}
                        />
                        {errors.nombre_tutor && <span className="error">{errors.nombre_tutor.message}</span>}
                        {serverErrors?.nombre_tutor && <span className="error">{serverErrors.nombre_tutor[0]}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Apellido *</label>
                        <input
                            className={`form-input ${errors.apellido_tutor ? 'error' : ''}`}
                            {...register("apellido_tutor", tutorValidationRulesCompletas.apellido_tutor)}
                            {...nameInputProps}
                            placeholder="Ej: Pérez"
                            disabled={estaCargando}
                        />
                        {errors.apellido_tutor && <span className="error">{errors.apellido_tutor.message}</span>}
                        {serverErrors?.apellido_tutor && <span className="error">{serverErrors.apellido_tutor[0]}</span>}
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">Género *</label>
                        <select 
                            className={`form-select ${errors.genero_tutor ? 'error' : ''}`}
                            {...register("genero_tutor", tutorValidationRulesCompletas.genero_tutor)}
                            disabled={estaCargando}
                        >
                            <option value="">-- Seleccionar --</option>
                            <option value="M">Masculino</option>
                            <option value="F">Femenino</option>
                        </select>
                        {errors.genero_tutor && <span className="error">{errors.genero_tutor.message}</span>}
                        {serverErrors?.genero_tutor && <span className="error">{serverErrors.genero_tutor[0]}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Teléfono *</label>
                        <input
                            className={`form-input ${errors.telefono_tutor ? 'error' : ''}`}
                            {...register("telefono_tutor", tutorValidationRulesCompletas.telefono_tutor)}
                            {...phoneInputProps}
                            disabled={estaCargando}
                        />
                        {errors.telefono_tutor && <span className="error">{errors.telefono_tutor.message}</span>}
                        {serverErrors?.telefono_tutor && <span className="error">{serverErrors.telefono_tutor[0]}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input
                            className={`form-input ${errors.correo_tutor ? 'error' : ''}`}
                            {...register("correo_tutor", tutorValidationRulesCompletas.correo_tutor)}
                            {...emailInputProps}
                            disabled={estaCargando}
                        />
                        {errors.correo_tutor && <span className="error">{errors.correo_tutor.message}</span>}
                        {serverErrors?.correo_tutor && <span className="error">{serverErrors.correo_tutor[0]}</span>}
                    </div>
                </div>

                <div className="form-grid">
                    <div className="form-group full-width">
                        <div className="label-with-button">
                            <label className="form-label">Parentesco *</label>
                            <button
                                type="button"
                                onClick={() => setMostrarModalParentesco(true)}
                                className="btn-agregar-colegio"
                                title="Agregar nuevo parentesco"
                                disabled={estaCargando}
                            >
                                +
                            </button>
                        </div>
                        
                        <BuscadorParentescos
                            parentescos={parentescos}
                            onParentescoSelect={(idParentesco) => {
                                setValue('id_parentesco', idParentesco, { shouldValidate: true });
                            }}
                            disabled={estaCargando || parentescos.length === 0}
                        />
                        
                        <input
                            type="hidden"
                            {...register("id_parentesco", { 
                                required: "Debe seleccionar un parentesco de la lista"
                            })}
                        />
                        
                        {errors.id_parentesco && <span className="error">{errors.id_parentesco.message}</span>}
                        {serverErrors?.id_parentesco && <span className="error">{serverErrors.id_parentesco[0]}</span>}
                    </div>
                </div>

                <div className="form-actions">  
                    <Button
                        variant="cancel"
                        type="outline"
                        onClick={onVolver}
                        disabled={estaCargando}
                        buttonType="button"
                    >
                        Volver a Alumno
                    </Button>
                    
                    <Button
                        variant="next"
                        type="solid"
                        size="large"
                        onClick={handleSubmit(handleSubmitTutorNuevo)}
                        disabled={estaCargando || Object.keys(errors).length > 0}
                        className="submit-button"
                    >
                        {estaCargando ? 'Procesando...' : 'Finalizar Registro'}
                    </Button>
                </div>  
            </form>

            {/* Modal fuera del formulario pero dentro del componente */}
            {mostrarModalParentesco && (
                <CrearParentescoModal
                    isOpen={mostrarModalParentesco}
                    onClose={() => setMostrarModalParentesco(false)}
                    onParentescoCreado={handleParentescoCreado}
                    parentescosExistentes={parentescos}
                />
            )}
        </div>
    );
}

export default FormTutorNuevo;