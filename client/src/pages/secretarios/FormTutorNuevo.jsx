import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createTutores } from '../../api/secretario.api';
import Button from "../../components/Buttons/Buttons";
import BuscadorParentescos from './BuscadorParentescos';
import CrearParentescoModal from './CrearParentescoModal';
import { useRegistration } from '../../contexts/RegistrationContext';
import { 
  tutorValidationRulesCompletas,
  nameInputProps, 
  dniInputProps, 
  phoneInputProps, 
  emailInputProps 
} from "../validations/tutorValidations.jsx";
// ✅ CORREGIR LA RUTA - está en pages/validations/
import { dniValidationRulesCompletoTutor } from "../validations/dniTutorValidations.jsx";

function FormTutorNuevo({ 
    parentescos, 
    loading, 
    serverErrors, 
    onVolver, 
    onSubmit,
    onParentescoCreado,
    alumnoDni
}) {
    const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, trigger, watch } = useForm({
      mode: "onChange",
      reValidateMode: "onChange"
    });
    const [mostrarModalParentesco, setMostrarModalParentesco] = useState(false);
    const [creandoTutor, setCreandoTutor] = useState(false);
    const { setTutorData, tutorData } = useRegistration();

    const validationRules = {
        ...tutorValidationRulesCompletas,
        dni_tutor: dniValidationRulesCompletoTutor(alumnoDni),
        id_parentesco: { 
            required: "Debe seleccionar un parentesco" 
        }
    };

    const formValues = watch();
    const idParentesco = watch("id_parentesco");

    useEffect(() => {
        if (tutorData && !tutorData.id_tutor) {
            console.log('Cargando datos de tutor nuevo guardados:', tutorData);
            
            if (tutorData.dni_tutor) setValue('dni_tutor', tutorData.dni_tutor.toString(), { shouldValidate: true });
            if (tutorData.nombre_tutor) setValue('nombre_tutor', tutorData.nombre_tutor, { shouldValidate: true });
            if (tutorData.apellido_tutor) setValue('apellido_tutor', tutorData.apellido_tutor, { shouldValidate: true });
            if (tutorData.genero_tutor) setValue('genero_tutor', tutorData.genero_tutor, { shouldValidate: true });
            if (tutorData.telefono_tutor) setValue('telefono_tutor', tutorData.telefono_tutor, { shouldValidate: true });
            if (tutorData.correo_tutor) setValue('correo_tutor', tutorData.correo_tutor, { shouldValidate: true });
            if (tutorData.id_parentesco) setValue('id_parentesco', tutorData.id_parentesco.toString(), { shouldValidate: true });
            
            trigger();
        }
    }, [tutorData, setValue, trigger]);

    useEffect(() => {
        const { dni_tutor, nombre_tutor, apellido_tutor, genero_tutor, telefono_tutor, correo_tutor, id_parentesco } = formValues;
        
        if (dni_tutor && nombre_tutor && apellido_tutor && genero_tutor && id_parentesco) {
            const parentescoSeleccionado = parentescos.find(p => p.id_parentesco === parseInt(id_parentesco));
            
            const tutorDataCompleto = {
                dni_tutor: parseInt(dni_tutor, 10),
                nombre_tutor: nombre_tutor.trim(),
                apellido_tutor: apellido_tutor.trim(),
                genero_tutor,
                telefono_tutor: telefono_tutor?.trim() || '',
                correo_tutor: correo_tutor?.trim().toLowerCase() || '',
                id_parentesco: parseInt(id_parentesco, 10),
                parentesco_nombre: parentescoSeleccionado?.parentesco_nombre || 'Parentesco no encontrado'
            };

            if (JSON.stringify(tutorData) !== JSON.stringify(tutorDataCompleto)) {
                console.log('Guardando datos de tutor nuevo en contexto:', tutorDataCompleto);
                setTutorData(tutorDataCompleto, false);
            }
        }
    }, [formValues, parentescos, setTutorData, tutorData]);

    const handleParentescoCreado = async (parentescoCreado) => {
        try {
            console.log('Parentesco creado y seleccionado:', parentescoCreado);
            
            if (onParentescoCreado) {
                onParentescoCreado(parentescoCreado);
            }
            
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
                
                const tutorDataCompletoConId = {
                    ...tutorDataForAPI,
                    id_tutor: tutorId,
                    id_parentesco: parseInt(data.id_parentesco, 10),
                    parentesco_nombre: parentescos.find(p => p.id_parentesco === parseInt(data.id_parentesco))?.parentesco_nombre || ''
                };
                setTutorData(tutorDataCompletoConId, false);
                
                onSubmit({
                    ...data,
                    tutorId: tutorId
                });
                
            } catch (tutorError) {
                if (tutorError.response?.status === 400) {
                    throw tutorError;
                } else {
                    alert('Error al crear tutor');
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
            {tutorData && tutorData.nombre_tutor && (
                <div className="tutor-seleccionado-info" style={{
                    background: '#e8f5e8',
                    padding: '10px',
                    borderRadius: '5px',
                    marginBottom: '15px',
                    border: '1px solid #4caf50'
                }}>
                    <strong>Tutor en progreso:</strong> {tutorData.nombre_tutor} {tutorData.apellido_tutor} 
                    {tutorData.parentesco_nombre && ` - Parentesco: ${tutorData.parentesco_nombre}`}
                    <br />
                    <small style={{color: '#666'}}>Los datos se guardan automáticamente</small>
                </div>
            )}

            {alumnoDni && (
                <div className="alumno-dni-info" style={{
                    background: '#fff3cd',
                    padding: '8px',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    border: '1px solid #ffeaa7',
                    fontSize: '14px'
                }}>
                    <strong>Alumno:</strong> DNI {alumnoDni} - El tutor no puede tener el mismo DNI
                </div>
            )}

            <form onSubmit={handleSubmit(handleSubmitTutorNuevo)} className='alumno-form'>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">DNI del Tutor *</label>
                        <input
                            className={`form-input ${errors.dni_tutor ? 'error' : ''}`}
                            {...register("dni_tutor", validationRules.dni_tutor)}
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
                            {...register("nombre_tutor", validationRules.nombre_tutor)}
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
                            {...register("apellido_tutor", validationRules.apellido_tutor)}
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
                            {...register("genero_tutor", validationRules.genero_tutor)}
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
                            {...register("telefono_tutor", validationRules.telefono_tutor)}
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
                            {...register("correo_tutor", validationRules.correo_tutor)}
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
                            valorSeleccionado={tutorData?.id_parentesco}
                        />
                        
                        <input
                            type="hidden"
                            {...register("id_parentesco", validationRules.id_parentesco)}
                        />
                        
                        {errors.id_parentesco && <span className="error">{errors.id_parentesco.message}</span>}
                        {serverErrors?.id_parentesco && <span className="error">{serverErrors.id_parentesco[0]}</span>}
                    </div>
                </div>

                <div className="form-actions">  
                    <Button
                        variant="back"
                        type="solid"
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

            {mostrarModalParentesco && (
                <CrearParentescoModal
                    isOpen={mostrarModalParentesco}
                    onClose={() => setMostrarModalParentesco(false)}
                    onParentescoCreado={handleParentescoCreado}
                    parentescosExistentes={parentescos}
                    onParentescoSeleccionado={(nuevoParentesco) => {
                        setValue('id_parentesco', nuevoParentesco.id_parentesco, { shouldValidate: true });
                    }}
                />
            )}
        </div>
    );
}

export default FormTutorNuevo;