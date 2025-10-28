import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from "../../components/Buttons/Buttons";
import BuscadorParentescos from './BuscadorParentescos';
import CrearParentescoModal from './CrearParentescoModal';

function FormTutorExistente({ 
    tutores, 
    parentescos, 
    loading, 
    serverErrors, 
    onVolver, 
    onSubmit 
}) {
    const { register, handleSubmit, formState: { errors }, setValue, trigger } = useForm();
    const [mostrarModalParentesco, setMostrarModalParentesco] = useState(false);

    const handleParentescoCreado = async (parentescoCreado) => {
        try {
            setValue('id_parentesco', parentescoCreado.id_parentesco, { shouldValidate: true });
            await trigger('id_parentesco');
            setMostrarModalParentesco(false);
        } catch (error) {
            console.error('Error al seleccionar parentesco creado:', error);
        }
    };

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit(onSubmit)} className='alumno-form'>
                <div className="form-grid">
                    <div className="form-group full-width">
                        <label className="form-label">Seleccionar Tutor Existente *</label>
                        <select
                            className={`form-select ${errors.id_tutor || serverErrors.id_tutor ? 'error' : ''}`}
                            {...register("id_tutor", { 
                                required: "Debe seleccionar un tutor existente"
                            })}
                            disabled={loading}
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
                                setValue('id_parentesco', idParentesco, { shouldValidate: true });
                            }}
                            disabled={loading || parentescos.length === 0}
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
                        variant="cancel"
                        type="outline"
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
                        onClick={handleSubmit(onSubmit)}
                        disabled={loading}
                        className="submit-button"
                    >
                        {loading ? 'Procesando...' : 'Finalizar Registro'}
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

export default FormTutorExistente;