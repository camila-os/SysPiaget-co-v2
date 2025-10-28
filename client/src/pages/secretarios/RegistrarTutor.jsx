import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router";
import { useRegistration } from '../../contexts/RegistrationContext';
import {
    getAllTutores,
    getAllParentesco,
    createAlumnoCompleto
} from '../../api/secretario.api';
import "../../style/RegistrarTutor.css";
import Perfil from "../../components/Perfil";
import Button from "../../components/Buttons/Buttons";
import FormTutorExistente from './FormTutorExistente';
import FormTutorNuevo from './FormTutorNuevo';

function RegistrarTutor() {
    const navigate = useNavigate();
    
    const { 
        alumnoData, 
        tutorData,
        tutorExistente,
        setTutorExistente,
        resetRegistration, 
        completeRegistration, 
        goToStep 
    } = useRegistration();
    
    const [tutores, setTutores] = useState([]);
    const [parentescos, setParentescos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [serverErrors, setServerErrors] = useState({});

    useEffect(() => {
        setError('');
    }, []);

    useEffect(() => {
        if (!alumnoData) {
            setError('Error: No se encontraron datos del alumno. Por favor, comience el proceso desde el formulario de alumno.');
            setLoading(false);
            return;
        }
        
        async function loadInitialData() {
            try {
                setLoading(true);
                
                const [tutoresResponse, parentescosResponse] = await Promise.all([
                    getAllTutores(),
                    getAllParentesco()
                ]);

                setTutores(tutoresResponse.data);
                setParentescos(parentescosResponse.data);

            } catch (error) {
                setError('Error al cargar los datos: ' + (error.response?.data?.message || error.message));
            } finally {
                setLoading(false);
            }
        }
        
        loadInitialData();
    }, [alumnoData]);

    const handleTutorExistenteChange = (esExistente) => {
        setTutorExistente(esExistente);
    };

    const handleVolverAlumno = () => {
        goToStep(1);
        navigate("/crear-alumno");
    };

    const handleCancelarProceso = () => {
        if (window.confirm('¿Está seguro de que desea cancelar el registro? Se perderán todos los datos ingresados.')) {
            resetRegistration();
            navigate("/secretario");
        }
    };

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            setServerErrors({});

            if (!alumnoData) {
                alert('❌ Error: No hay datos del alumno. Regrese al formulario de alumno.');
                navigate("/crear-alumno");
                setLoading(false);
                return;
            }

            let tutorId;

            if (tutorExistente) {
                // Tutor existente - solo necesitamos el ID
                tutorId = parseInt(data.id_tutor, 10);
                
                if (!tutorId) {
                    alert('❌ Debe seleccionar un tutor existente');
                    setLoading(false);
                    return;
                }

            } else {
                // Tutor nuevo - ya viene procesado desde FormTutorNuevo
                tutorId = data.tutorId;
                
                if (!tutorId) {
                    alert('❌ Error al crear el tutor');
                    setLoading(false);
                    return;
                }
            }

            const datosCompletos = {
                alumno: {
                    nombre_alumno: alumnoData.nombre_alumno,
                    apellido_alumno: alumnoData.apellido_alumno,
                    dni_alumno: alumnoData.dni_alumno,
                    fecha_nacimiento_alumno: alumnoData.fecha_nacimiento_alumno,
                    genero_alumno: alumnoData.genero_alumno,
                    observaciones_alumno: alumnoData.observaciones_alumno || '',
                    estado_alumno: 'Activo'
                },
                relacionGrado: {
                    id_grado: alumnoData.id_grado,
                    id_colegio_procedencia: alumnoData.id_colegio,
                },
                relacionTutor: {
                    id_tutor: tutorId,
                    id_parentesco: parseInt(data.id_parentesco, 10)
                }
            };

            try {
                const resultado = await createAlumnoCompleto(datosCompletos);
                
                if (resultado.data && resultado.data.success) {
                    completeRegistration();
                    alert('✅ ¡Alumno y tutor registrados exitosamente!');
                    navigate("/secretario");
                } else {
                    alert('❌ Error al registrar alumno');
                    setLoading(false);
                }
            } catch (error) {
                if (error.response?.status === 400) {
                    setServerErrors(error.response.data);
                    alert('❌ Revise los errores en el formulario');
                } else {
                    alert('❌ Error al registrar alumno');
                }
                setLoading(false);
            }

        } catch (error) {
            alert('❌ Error en el proceso de registro');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className='blank'>
                <p>⏳ Cargando datos...</p>
                <Button
                    variant="cancel"
                    type="outline"
                    onClick={handleCancelarProceso}
                >
                    Cancelar Proceso
                </Button>
            </div>
        );
    }

    if (error) {
        return (
            <div className='blank'>
                <p style={{ color: 'red' }}>❌ {error}</p>
                <Button
                    variant="cancel"
                    type="outline"
                    onClick={handleCancelarProceso}
                >
                    Volver al Inicio
                </Button>
            </div>
        );
    }

    if (!alumnoData) {
        return (
            <div className='blank'>
                <p style={{ color: 'red' }}>❌ No se encontraron datos del alumno</p>
                <Button
                    variant="cancel"
                    type="outline"
                    onClick={() => navigate("/crear-alumno")}
                >
                    Volver a Datos del Alumno
                </Button>
            </div>
        );
    }

    return (
        <div className="page-container">
            <header className="page-header">
                <Perfil />
            </header>
            
            <main className="page-main">
                <div className='alumno-form-container'>
                    <div className="form-header">
                        <h2>Paso 2: Asignar Tutor al Alumno</h2>
                        <Button
                            variant="cancel"
                            type="outline"
                            size="square"
                            onClick={handleCancelarProceso}
                            className="close-button"
                            title="Cancelar registro"
                        >
                            ×
                        </Button>
                    </div>
                    
                    <div className='alumno-info'>
                        <h4>Alumno a registrar:</h4>
                        <p><strong>Nombre:</strong> {alumnoData.nombre_alumno} {alumnoData.apellido_alumno}</p>
                        <p><strong>DNI:</strong> {alumnoData.dni_alumno}</p>
                        <p><strong>Fecha Nacimiento:</strong> {new Date(alumnoData.fecha_nacimiento_alumno).toLocaleDateString()}</p>
                        <p><strong>Género:</strong> {alumnoData.genero_alumno === 'M' ? 'Masculino' : 'Femenino'}</p>
                    </div>

                    <div className="form-section">
                        <h3>Selección de Tutor</h3>
                        
                        <div className="tutor-options">
                            <label>Tipo de Tutor:</label>
                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        value="existente"
                                        checked={tutorExistente}
                                        onChange={() => handleTutorExistenteChange(true)}
                                    />
                                    Seleccionar tutor existente
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        value="nuevo"
                                        checked={!tutorExistente}
                                        onChange={() => handleTutorExistenteChange(false)}
                                    />
                                    Registrar nuevo tutor
                                </label>
                            </div>
                        </div>

                        {tutorExistente ? (
                            <FormTutorExistente
                                tutores={tutores}
                                parentescos={parentescos}
                                loading={loading}
                                serverErrors={serverErrors}
                                onVolver={handleVolverAlumno}
                                onSubmit={onSubmit}
                            />
                        ) : (
                            <FormTutorNuevo
                                parentescos={parentescos}
                                loading={loading}
                                serverErrors={serverErrors}
                                onVolver={handleVolverAlumno}
                                onSubmit={onSubmit}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default RegistrarTutor;