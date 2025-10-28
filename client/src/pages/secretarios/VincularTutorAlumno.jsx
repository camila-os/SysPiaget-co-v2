import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { 
    getAllTutores, 
    getAllParentesco,
    getAlumnoByDni,
    createAlumnoXTutor,
    activarAlumnoCompleto,
    getAlumnosXTutorByAlumnoDni
} from '../../api/secretario.api';
import "../../style/RegistrarTutor.css";
import Perfil from "../../components/Perfil";

function VincularTutorAlumno() {
    const navigate = useNavigate();
    const params = useParams();
    const { register, handleSubmit, formState: { errors }, watch, setError: setFormError, clearErrors } = useForm();
    
    const [tutores, setTutores] = useState([]);
    const [parentescos, setParentescos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alumno, setAlumno] = useState(null);
    const [error, setError] = useState('');
    const [tutoresExistentes, setTutoresExistentes] = useState([]);

    const dniAlumno = params.dni_alumno;
    const tutorSeleccionado = watch("id_tutor");

    // Validación para evitar tutores duplicados
    const validarTutorUnico = (idTutor) => {
        if (!idTutor) return true;
        
        const tutorYaExiste = tutoresExistentes.some(tutor => 
            tutor.id_tutor === parseInt(idTutor)
        );
        
        if (tutorYaExiste) {
            return "Este tutor ya está vinculado al alumno";
        }
        
        return true;
    };

    // Validación para límite de tutores
    const validarLimiteTutores = () => {
        if (tutoresExistentes.length >= 3) {
            return "El alumno ya tiene el máximo de 3 tutores permitidos";
        }
        return true;
    };

    useEffect(() => {
        async function loadInitialData() {
            try {
                setLoading(true);
                console.log(' Cargando datos para vincular tutor...');
                
                const [alumnoResponse, tutoresResponse, parentescosResponse, tutoresAlumnoResponse] = await Promise.all([
                    getAlumnoByDni(dniAlumno),
                    getAllTutores(), // ✅ Ya filtra solo tutores activos
                    getAllParentesco(),
                    getAlumnosXTutorByAlumnoDni(dniAlumno)
                ]);

                console.log(' Alumno cargado:', alumnoResponse.data);
                console.log(' Tutores ACTIVOS cargados:', tutoresResponse.data);
                console.log(' Parentescos cargados:', parentescosResponse.data);
                console.log(' Tutores existentes del alumno:', tutoresAlumnoResponse.data);

                setAlumno(alumnoResponse.data);
                setTutores(tutoresResponse.data);
                setParentescos(parentescosResponse.data);
                
                // Extraer solo la información del tutor de la respuesta
                const tutoresData = tutoresAlumnoResponse.data || [];
                const tutoresInfo = tutoresData.map(relacion => ({
                    id_tutor: relacion.id_tutor,
                    nombre_tutor: relacion.nombre_tutor,
                    apellido_tutor: relacion.apellido_tutor,
                    dni_tutor: relacion.dni_tutor,
                    id_parentesco: relacion.id_parentesco,
                    parentesco_nombre: relacion.parentesco_nombre
                }));
                
                setTutoresExistentes(tutoresInfo);

            } catch (error) {
                console.error(' Error cargando datos:', error);
                setError('Error al cargar los datos: ' + (error.response?.data?.message || error.message));
            } finally {
                setLoading(false);
            }
        }

        if (dniAlumno) {
            loadInitialData();
        } else {
            setError('No se proporcionó DNI del alumno');
            setLoading(false);
        }
    }, [dniAlumno]);

    // Efecto para validar en tiempo real
    useEffect(() => {
        if (tutorSeleccionado) {
            const errorTutorUnico = validarTutorUnico(tutorSeleccionado);
            if (errorTutorUnico !== true) {
                setFormError("id_tutor", { type: "manual", message: errorTutorUnico });
            } else {
                clearErrors("id_tutor");
            }
        }
    }, [tutorSeleccionado, tutoresExistentes]);

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            console.log(' Datos para vincular:', data);

            // Validaciones antes de enviar
            const validacionLimite = validarLimiteTutores();
            if (validacionLimite !== true) {
                alert(validacionLimite);
                return;
            }

            const validacionTutorUnico = validarTutorUnico(data.id_tutor);
            if (validacionTutorUnico !== true) {
                alert(validacionTutorUnico);
                return;
            }

            // CREAR RELACIÓN ALUMNO - TUTOR
            const relacionData = {
                id_alumno: alumno.id_alumno,
                id_tutor: parseInt(data.id_tutor, 10),
                id_parentesco: parseInt(data.id_parentesco, 10)
            };
            
            console.log(' Enviando relación tutor:', relacionData);
            
            await createAlumnoXTutor(relacionData);
            console.log(' Relación alumno-tutor creada');

            // Actualizar lista de tutores existentes
            const tutorAgregado = tutores.find(t => t.id_tutor === parseInt(data.id_tutor));
            if (tutorAgregado) {
                const parentescoSeleccionado = parentescos.find(p => p.id_parentesco === parseInt(data.id_parentesco));
                setTutoresExistentes(prev => [...prev, {
                    ...tutorAgregado,
                    id_parentesco: parseInt(data.id_parentesco),
                    parentesco_nombre: parentescoSeleccionado?.parentesco_nombre || 'No especificado'
                }]);
            }

            // ACTIVAR ALUMNO (SOLO SI TIENE TUTOR)
            console.log(' Activando alumno completo...');
            
            try {
                await activarAlumnoCompleto(alumno.dni_alumno);
                console.log(' Alumno activado con tutor');
            } catch (activarError) {
                console.error(' Error activando alumno:', activarError);
                console.warn('Alumno no pudo ser activado, pero la relación se creó');
            }

            alert('¡Tutor vinculado exitosamente!');
            
            // Preguntar si quiere agregar otro tutor o finalizar
            const nuevosTutoresCount = tutoresExistentes.length + 1;
            if (nuevosTutoresCount < 3) {
                const agregarOtro = window.confirm(
                    `¿Desea agregar otro tutor? (${nuevosTutoresCount}/3 tutores vinculados)`
                );
                if (agregarOtro) {
                    // Limpiar formulario para agregar otro tutor
                    clearErrors();
                    reset();
                } else {
                    navigate("/ListaAlumnos");
                }
            } else {
                alert('El alumno ya tiene el máximo de 3 tutores permitidos');
                navigate("/ListaAlumnos");
            }

        } catch (error) {
            console.error(' Error vinculando tutor:', error);
            const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           error.message;
            
            // Manejar error específico de duplicado
            if (errorMessage.includes('duplicad') || errorMessage.includes('ya existe')) {
                alert('Error: Este tutor ya está vinculado al alumno');
            } else {
                alert(' Error al vincular tutor: ' + errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className='blank'>
                <p> Cargando datos...</p>
                <button onClick={() => navigate("/secretario/")} className='boton'>Cancelar</button>
            </div>
        );
    }

    if (error) {
        return (
            <div className='blank'>
                <p style={{ color: 'red' }}> {error}</p>
                <button onClick={() => navigate("/secretario/")} className='boton'>Volver</button>
            </div>
        );
    }

    if (!alumno) {
        return (
            <div className='blank'>
                <p style={{ color: 'red' }}> No se encontró el alumno</p>
                <button onClick={() => navigate("/secretario/")} className='boton'>Volver</button>
            </div>
        );
    }

    return (
        <div className="page-container">
            <header className="page-header">
                <Perfil />
            </header>
            
            <main className="page-main">
                <div className='registrar-tutor-container'>
                    <div className="form-header">
                        <h2>Vincular Tutor con Alumno</h2>
                        <button onClick={() => navigate("/ListaAlumnos")} className='form-btn btn-secondary'>Cancelar</button>
                    </div>
                    
                    <div className='alumno-info'>
                        <h4> Alumno seleccionado:</h4>
                        <p><strong>Nombre:</strong> {alumno.nombre_alumno} {alumno.apellido_alumno}</p>
                        <p><strong>DNI:</strong> {alumno.dni_alumno}</p>
                        <p><strong>Fecha Nacimiento:</strong> {new Date(alumno.fecha_nacimiento_alumno).toLocaleDateString()}</p>
                        <p><strong>Género:</strong> {alumno.genero_alumno === 'M' ? 'Masculino' : 'Femenino'}</p>
                        
                        {/* Mostrar advertencia si alcanzó el límite */}
                        {tutoresExistentes.length >= 3 && (
                            <div className="warning-message">
                                 El alumno ya tiene el máximo de 3 tutores permitidos
                            </div>
                        )}
                    </div>

                    {/* PANEL INFORMATIVO NUEVO */}
                    <div className="info-panel">
                        <h4>💡 Información sobre tutores:</h4>
                        <p>• Solo se muestran tutores <strong>activos</strong> en la lista</p>
                        <p>• Los tutores <strong>inactivos</strong> no pueden ser asignados</p>
                        <p>• Para reactivar un tutor, use la opción "Activar" en la lista de tutores</p>
                    </div>

                    <form 
                        onSubmit={handleSubmit(onSubmit)} 
                        className='tutor-form'
                    >
                        <div className="form-section">
                            <h3>Seleccionar Tutor</h3>
                            
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label className="form-label">Seleccionar Tutor Existente *</label>
                                    <select
                                        className={`form-select ${errors.id_tutor ? 'error' : ''}`}
                                        {...register("id_tutor", { 
                                            required: "Debe seleccionar un tutor",
                                            validate: {
                                                tutorUnico: (value) => validarTutorUnico(value),
                                                limiteTutores: () => validarLimiteTutores()
                                            }
                                        })}
                                        disabled={tutoresExistentes.length >= 3}
                                    >
                                        <option value="">-- Seleccione Tutor --</option>
                                        {Array.isArray(tutores) && tutores.map((tutor) => {
                                            const yaVinculado = tutoresExistentes.some(t => 
                                                t.id_tutor === tutor.id_tutor
                                            );
                                            return (
                                                <option 
                                                    key={`tutor-${tutor.id_tutor}`} 
                                                    value={tutor.id_tutor}
                                                    disabled={yaVinculado}
                                                >
                                                    {tutor.nombre_tutor} {tutor.apellido_tutor} - DNI: {tutor.dni_tutor}
                                                    {yaVinculado && ' (YA VINCULADO)'}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    {errors.id_tutor && <span className="error-message">{errors.id_tutor.message}</span>}
                                    <div className="form-info">
                                        Tutores vinculados: {tutoresExistentes.length}/3
                                        {tutoresExistentes.length >= 3 && ' - Límite alcanzado'}
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label className="form-label">Parentesco *</label>
                                    <select
                                        className={`form-select ${errors.id_parentesco ? 'error' : ''}`}
                                        {...register("id_parentesco", { 
                                            required: "Debe seleccionar un parentesco" 
                                        })}
                                        disabled={tutoresExistentes.length >= 3}
                                    >
                                        <option value="">-- Seleccione Parentesco --</option>
                                        {Array.isArray(parentescos) && parentescos.map((parentesco) => (
                                            <option key={`parentesco-${parentesco.id_parentesco}`} value={parentesco.id_parentesco}>
                                                {parentesco.parentesco_nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.id_parentesco && <span className="error-message">{errors.id_parentesco.message}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">  
                            <button type="button" onClick={() => navigate("/ListaAlumnos")} className="form-btn btn-secondary">
                                Volver a Lista
                            </button>
                            <button 
                                type="submit" 
                                className="form-btn btn-primary" 
                                disabled={loading || tutoresExistentes.length >= 3}
                            >
                                {loading ? 'Vinculando...' : `Vincular Tutor (${tutoresExistentes.length}/3)`}
                            </button>
                            <button 
                                type="button"
                                onClick={() => navigate("/registrar-tutor")}
                                className="form-btn btn-secondary"
                                disabled={tutoresExistentes.length >= 3}
                            >
                                Crear Nuevo Tutor
                            </button>
                        </div>  
                    </form>
                </div>
            </main>
        </div>
    );
}

export default VincularTutorAlumno;