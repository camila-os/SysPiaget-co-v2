import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router";
import { getTutorCompleto, getAllParentesco, updateParentescoAlumnoTutor } from '../../api/secretario.api';
import "../../style/Tarjeta.css";

function DetalleTutor() {
    const { id_tutor } = useParams();
    const navigate = useNavigate();
    const [tutor, setTutor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [parentescos, setParentescos] = useState([]);
    const [editandoParentesco, setEditandoParentesco] = useState(null); // Para controlar qué alumno se está editando

    useEffect(() => {
        async function loadTutor() {
            try {
                setLoading(true);
                console.log(' Cargando detalle del tutor...');
                
                const [tutorResponse, parentescosResponse] = await Promise.all([
                    getTutorCompleto(id_tutor),
                    getAllParentesco()
                ]);
                
                console.log(' Tutor cargado:', tutorResponse.data);
                console.log(' Parentescos cargados:', parentescosResponse.data);
                
                setTutor(tutorResponse.data);
                setParentescos(parentescosResponse.data);
                
            } catch (error) {
                console.error(' Error cargando tutor:', error);
                setError('Error al cargar los datos del tutor: ' + error.message);
            } finally {
                setLoading(false);
            }
        }
        loadTutor();
    }, [id_tutor]);

    const handleCambiarParentesco = async (alumnoDni, nuevoParentescoId) => {
        try {
            console.log(` Cambiando parentesco para alumno ${alumnoDni}:`, nuevoParentescoId);
            
            const response = await updateParentescoAlumnoTutor(alumnoDni, {
                id_parentesco: parseInt(nuevoParentescoId, 10)
            });

            console.log(' Parentesco actualizado:', response.data);
            
            // Actualizar el estado local para reflejar el cambio
            setTutor(prevTutor => ({
                ...prevTutor,
                alumnos: prevTutor.alumnos.map(alumno => 
                    alumno.dni_alumno === alumnoDni 
                        ? { ...alumno, parentesco: parentescos.find(p => p.id_parentesco === parseInt(nuevoParentescoId))?.parentesco_nombre }
                        : alumno
                )
            }));

            setEditandoParentesco(null); // Cerrar el modo edición
            alert(' Parentesco actualizado exitosamente!');

        } catch (error) {
            console.error(' Error actualizando parentesco:', error);
            const errorMessage = error.response?.data?.error || 
                               error.response?.data?.message || 
                               error.message;
            alert(' Error al actualizar parentesco: ' + errorMessage);
        }
    };

    const cancelarEdicion = () => {
        setEditandoParentesco(null);
    };

    if (loading) {
        return (
            <div className="container">
                <div className="loading"> Cargando datos del tutor...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <div className="error-message"> {error}</div>
                <button onClick={() => navigate("/ListaAlumnos")} className="btn btn-secondary">Volver</button>
            </div>
        );
    }

    if (!tutor) {
        return (
            <div className="container">
                <div className="error-message"> No se encontró el tutor</div>
                <button onClick={() => navigate("/ListaAlumnos")} className="btn btn-secondary">Volver</button>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="header">
                <button onClick={() => navigate("/ListaAlumnos")} className="btn btn-secondary">
                    ← Volver a Alumnos
                </button>
                <h1>Detalle del Tutor</h1>
            </div>

            <div className="card tutor-detalle-card">
                <div className="card-header">
                    <h2>{tutor.nombre_tutor} {tutor.apellido_tutor}</h2>
                    <span className={`badge ${tutor.estado_tutor === 'Activo' ? 'badge-success' : 'badge-danger'}`}>
                        {tutor.estado_tutor}
                    </span>
                </div>

                <div className="card-body">
                    <div className="info-section">
                        <h3> Información Personal</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="label">DNI:</span>
                                <span className="value">{tutor.dni_tutor}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Teléfono:</span>
                                <span className="value">{tutor.telefono_tutor}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Email:</span>
                                <span className="value">{tutor.correo_tutor}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Género:</span>
                                <span className="value">
                                    {tutor.genero_tutor === 'M' ? 'Masculino' : 'Femenino'}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="label">Estado:</span>
                                <span className="value">{tutor.estado_tutor}</span>
                            </div>
                        </div>
                    </div>

                    {tutor.alumnos && tutor.alumnos.length > 0 && (
                        <div className="info-section">
                            <h3>👥 Alumnos a Cargo</h3>
                            <div className="alumnos-list">
                                {tutor.alumnos.map((alumno) => (
                                    <div key={alumno.id_alumno} className="alumno-item">
                                        <div className="alumno-info">
                                            <strong>{alumno.nombre_completo}</strong>
                                            <span>DNI: {alumno.dni_alumno}</span>
                                            
                                            {/* Mostrar parentesco actual o selector para editar */}|
                                            {editandoParentesco === alumno.dni_alumno ? (
                                                <div className="parentesco-editor">
                                                    <label>Parentesco:</label>
                                                    <select
                                                        defaultValue={alumno.parentesco}
                                                        onChange={(e) => handleCambiarParentesco(alumno.dni_alumno, e.target.value)}
                                                        className="form-select-sm"
                                                    >
                                                        <option value="">-- Seleccione --</option>
                                                        {Array.isArray(parentescos) && parentescos.map((parentesco) => (
                                                            <option 
                                                                key={`parentesco-${parentesco.id_parentesco}`} 
                                                                value={parentesco.id_parentesco}
                                                            >
                                                                {parentesco.parentesco_nombre}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button 
                                                        onClick={cancelarEdicion}
                                                        className="btn btn-sm btn-secondary"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            ) : (
                                                <span>
                                                    Parentesco: {alumno.parentesco || 'No especificado'}
                                                    <button 
                                                        onClick={() => setEditandoParentesco(alumno.dni_alumno)}
                                                        className="btn btn-sm btn-outline-primary ml-2"
                                                    >
                                                         Cambiar
                                                    </button>
                                                </span>
                                            )}
                                            
                                            <span className={`badge ${alumno.estado === 'Activo' ? 'badge-success' : 'badge-danger'}`}>
                                                {alumno.estado}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="card-actions">
                    <button 
                        onClick={() => navigate(`/ModificarTutor/${tutor.id_tutor}`)}
                        className="btn btn-warning"
                    >
                         Modificar Tutor
                    </button>
                    <button 
                        onClick={() => navigate("/ListaAlumnos")}
                        className="btn btn-secondary"
                    >
                        Volver a la Lista
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DetalleTutor;