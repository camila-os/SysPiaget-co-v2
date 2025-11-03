import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Button from "../../components/Buttons/Buttons";
import BuscadorParentescos from './BuscadorParentescos';
import CrearParentescoModal from './CrearParentescoModal';
import { useRegistration } from '../../contexts/RegistrationContext';

function FormTutorExistente({ 
    tutores, 
    parentescos, 
    loading, 
    serverErrors, 
    onVolver, 
    onSubmit,
    onParentescoCreado
}) {
    const { register, handleSubmit, formState: { errors }, setValue, trigger, watch } = useForm();
    const [mostrarModalParentesco, setMostrarModalParentesco] = useState(false);
    const { setTutorData, tutorData } = useRegistration();

    // Cargar datos guardados cuando el componente se monte
    useEffect(() => {
        if (tutorData && tutorData.id_tutor && tutorData.id_parentesco) {
            console.log('🔄 Cargando datos guardados en formulario:', tutorData);
            
            setValue('id_tutor', tutorData.id_tutor.toString(), { shouldValidate: true });
            setValue('id_parentesco', tutorData.id_parentesco.toString(), { shouldValidate: true });
            
            trigger();
        }
    }, [tutorData, setValue, trigger]);

    // Observar cambios en los campos
    const idTutor = watch("id_tutor");
    const idParentesco = watch("id_parentesco");

    console.log('🔍 DEBUG FormTutorExistente - Render:', {
        idTutor,
        idParentesco,
        tutoresCount: tutores?.length,
        parentescosCount: parentescos?.length,
        tutorDataEnContexto: tutorData
    });

    // Guardar en contexto cuando ambos campos estén completos
    useEffect(() => {
        console.log('🔄 useEffect ejecutado - Campos:', { idTutor, idParentesco });
        
        if (idTutor && idParentesco) {
            const tutorSeleccionado = tutores.find(t => t.id_tutor === parseInt(idTutor));
            const parentescoSeleccionado = parentescos.find(p => p.id_parentesco === parseInt(idParentesco));
            
            console.log('🔍 DEBUG - Encontró objetos:', {
                tutorSeleccionado: !!tutorSeleccionado,
                parentescoSeleccionado: !!parentescoSeleccionado
            });

            if (tutorSeleccionado && parentescoSeleccionado) {
                const nuevoTutorData = {
                    ...tutorSeleccionado,
                    id_parentesco: parseInt(idParentesco),
                    parentesco_nombre: parentescoSeleccionado?.parentesco_nombre || 'Parentesco no encontrado' // ✅ CORREGIDO
                };

                console.log('💾 DEBUG - Intentando guardar en contexto:', nuevoTutorData);
                
                if (JSON.stringify(tutorData) !== JSON.stringify(nuevoTutorData)) {
                    console.log('✅ Guardando datos en contexto...');
                    setTutorData(nuevoTutorData, true);
                } else {
                    console.log('⏭️  Datos iguales, no se guarda');
                }
            }
        }
    }, [idTutor, idParentesco, tutores, parentescos, setTutorData, tutorData]);

    // Manejar parentesco creado
    const handleParentescoCreado = async (parentescoCreado) => {
        try {
            console.log('🎯 Parentesco creado y seleccionado:', parentescoCreado);
            
            // 1. Notificar al formulario principal para actualizar la lista global
            if (onParentescoCreado) {
                onParentescoCreado(parentescoCreado);
            }
            
            // 2. Seleccionar automáticamente el nuevo parentesco
            setValue('id_parentesco', parentescoCreado.id_parentesco, { shouldValidate: true });
            await trigger('id_parentesco');
            
            // 3. Cerrar modal
            setMostrarModalParentesco(false);
            
        } catch (error) {
            console.error('Error al seleccionar parentesco creado:', error);
        }
    };

    const onSubmitForm = (data) => {
        console.log('📤 onSubmitForm - Datos del formulario:', data);
        onSubmit(data);
    };

    return (
        <div className="form-container">
            {/* Información del tutor seleccionado */}
            {tutorData && tutorData.id_tutor && (
                <div className="tutor-seleccionado-info" style={{
                    background: '#e8f5e8',
                    padding: '10px',
                    borderRadius: '5px',
                    marginBottom: '15px',
                    border: '1px solid #4caf50'
                }}>
                    <strong>✅ Tutor seleccionado:</strong> {tutorData.nombre_tutor} {tutorData.apellido_tutor} 
                    {tutorData.parentesco_nombre && ` - Parentesco: ${tutorData.parentesco_nombre}`}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmitForm)} className='alumno-form'>
                <div className="form-grid">
                    <div className="form-group full-width">
                        <label className="form-label">Seleccionar Tutor Existente *</label>
                        <select
                            className={`form-select ${errors.id_tutor || serverErrors.id_tutor ? 'error' : ''}`}
                            {...register("id_tutor", { 
                                required: "Debe seleccionar un tutor existente"
                            })}
                            disabled={loading}
                            onChange={(e) => {
                                console.log('🎯 Tutor seleccionado:', e.target.value);
                            }}
                        >
                            <option value="">-- Seleccione Tutor --</option>
                            {Array.isArray(tutores) && tutores.map((tutor) => (
                                <option key={`tutor-${tutor.id_tutor}`} value={tutor.id_tutor}>
                                    {tutor.nombre_tutor} {tutor.apellido_tutor} - DNI: {tutor.dni_tutor}
                                </option>
                            ))}
                        </select>
                        {errors.id_tutor && <span className="error">{errors.id_tutor.message}</span>}
                        {serverErrors.id_tutor && <span className="error">{serverErrors.id_tutor[0]}</span>}
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
                                disabled={loading}
                            >
                                +
                            </button>
                        </div>
                        
                        <BuscadorParentescos
                            parentescos={parentescos}
                            onParentescoSelect={(idParentesco) => {
                                console.log('🎯 Parentesco seleccionado desde Buscador:', idParentesco);
                                console.log('📊 Estado actual - idParentesco en watch:', watch("id_parentesco"));
                                setValue('id_parentesco', idParentesco, { 
                                    shouldValidate: true,
                                    shouldDirty: true 
                                });
                                trigger('id_parentesco');
                            }}
                            disabled={loading || parentescos.length === 0}
                            valorSeleccionado={tutorData?.id_parentesco || watch("id_parentesco")} // ✅ MEJORADO
                        />
                        
                        <input
                            type="hidden"
                            {...register("id_parentesco", { 
                                required: "Debe seleccionar un parentesco de la lista"
                            })}
                        />
                        
                        {errors.id_parentesco && <span className="error">{errors.id_parentesco.message}</span>}
                        {serverErrors.id_parentesco && <span className="error">{serverErrors.id_parentesco[0]}</span>}
                    </div>
                </div>

                <div className="form-actions">  
                    <Button
                        variant="back"
                        type="solid"
                        onClick={onVolver}
                        disabled={loading}
                        buttonType="button"
                    >
                        Volver a Alumno
                    </Button>
                    
                    <Button
                        variant="next"
                        type="solid"
                        size="large"
                        onClick={handleSubmit(onSubmitForm)}
                        disabled={loading}
                        className="submit-button"
                    >
                        {loading ? 'Procesando...' : 'Finalizar Registro'}
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
                        // Selección automática adicional
                        setValue('id_parentesco', nuevoParentesco.id_parentesco, { shouldValidate: true });
                    }}
                />
            )}
        </div>
    );
}

export default FormTutorExistente;