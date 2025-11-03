import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
    getAlumnosLista,
    desactivarAlumnoByDni,
    activarAlumnoByDni,
    deleteAlumnoXTutor,
    getAlumnosXTutorByAlumnoDni
} from "../../api/secretario.api";
import "./AlumnoListCard.css";
import "../../style/tutor-actions.css"

function AlumnoListTable() {
    const navigate = useNavigate();
    const [alumnos, setAlumnos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtro, setFiltro] = useState('');
    const [eliminandoRelacion, setEliminandoRelacion] = useState(null);

    // FUNCIÓN PARA FORMATEAR FECHA SIN PROBLEMAS DE ZONA HORARIA
    const formatearFechaLocal = (fechaString) => {
        if (!fechaString) return 'No especificada';
        
        try {
            if (typeof fechaString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaString)) {
                const [año, mes, dia] = fechaString.split('-');
                return `${dia}/${mes}/${año}`;
            }
            
            const fecha = new Date(fechaString);
            
            if (isNaN(fecha.getTime())) {
                return 'Fecha inválida';
            }
            
            const año = fecha.getFullYear();
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const dia = String(fecha.getDate()).padStart(2, '0');
            
            return `${dia}/${mes}/${año}`;
        } catch (error) {
            console.error('Error formateando fecha:', error);
            return 'Fecha inválida';
        }
    };

    useEffect(() => {
        async function loadAlumnos() {
            try {
                setLoading(true);
                console.log('Cargando lista de alumnos...');
                
                const response = await getAlumnosLista();
                console.log('Alumnos cargados:', response.data);
                
                if (response.data && response.data.length > 0) {
                    const primerAlumno = response.data[0];
                    console.log('Estructura COMPLETA del primer alumno:', primerAlumno);
                }
                
                if (Array.isArray(response.data)) {
                    setAlumnos(response.data);
                } else {
                    setAlumnos([]);
                    setError('Formato de datos incorrecto');
                }
                
            } catch (error) {
                console.error('Error cargando alumnos:', error);
                setError('Error al cargar los alumnos: ' + error.message);
                setAlumnos([]);
            } finally {
                setLoading(false);
            }
        }
        loadAlumnos();
    }, []);

    // FUNCIONES PARA MOSTRAR DATOS
    const mostrarGrado = (alumno) => {
        if (alumno.grado_info && alumno.grado_info.nombre_grado) {
            return alumno.grado_info.nombre_grado;
        }
        return 'No asignado';
    };

    const mostrarTutores = (alumno) => {
        return alumno.tutores_info || [];
    };

    const mostrarColegio = (alumno) => {
        if (alumno.colegio_procedencia && alumno.colegio_procedencia.nombre) {
            return alumno.colegio_procedencia.nombre;
        }
        return 'No especificado';
    };

    // FUNCIONES DE ACCIÓN (mantienen la misma lógica)
    const handleVerDetalleTutor = (tutorId, tutorNombre) => {
        if (tutorId) {
            navigate(`/DetalleTutor/${tutorId}`);
        } else {
            alert(`No se puede ver los detalles del tutor: ${tutorNombre}`);
        }
    };

    const handleDesactivarAlumno = async (dni_alumno, nombre, grado) => {
        const mensaje = grado && grado !== 'No asignado' 
            ? `¿Está seguro de que desea DESACTIVAR al alumno ${nombre}?\n\n Esto liberará un asiento en el grado ${grado}.`
            : `¿Está seguro de que desea DESACTIVAR al alumno ${nombre}?`;

        if (window.confirm(mensaje)) {
            try {
                const response = await desactivarAlumnoByDni(dni_alumno);
                let mensajeExito = `Alumno ${nombre} desactivado correctamente`;
                if (response.data.asiento_liberado && grado && grado !== 'No asignado') {
                    mensajeExito += `\n Se liberó un asiento en ${grado}`;
                }
                alert(mensajeExito);
                
                const alumnosResponse = await getAlumnosLista();
                if (Array.isArray(alumnosResponse.data)) {
                    setAlumnos(alumnosResponse.data);
                }
            } catch (error) {
                console.error('Error desactivando alumno:', error);
                let mensajeError = 'Error al desactivar alumno';
                
                if (error.response?.data?.error) {
                    mensajeError = error.response.data.error;
                } else if (error.response?.data?.message) {
                    mensajeError = error.response.data.message;
                } else if (error.message) {
                    mensajeError = error.message;
                }
                
                alert(mensajeError);
            }
        }
    };

    const handleActivarAlumno = async (dni_alumno, nombre, grado) => {
        const mensaje = grado && grado !== 'No asignado' 
            ? `¿Está seguro de que desea ACTIVAR al alumno ${nombre}?\n\n Esto ocupará un asiento en el grado ${grado}.`
            : `¿Está seguro de que desea ACTIVAR al alumno ${nombre}?`;

        if (window.confirm(mensaje)) {
            try {
                const response = await activarAlumnoByDni(dni_alumno);
                let mensajeExito = `Alumno ${nombre} activado correctamente`;
                if (response.data.asiento_ocupado && grado && grado !== 'No asignado') {
                    mensajeExito += `\n Se ocupó un asiento en ${grado}`;
                }
                alert(mensajeExito);
                
                const alumnosResponse = await getAlumnosLista();
                if (Array.isArray(alumnosResponse.data)) {
                    setAlumnos(alumnosResponse.data);
                }
            } catch (error) {
                console.error('Error activando alumno:', error);
                let mensajeError = 'Error al activar alumno';
                
                if (error.response?.data?.error) {
                    if (error.response.data.error.includes('capacidad') || error.response.data.error.includes('cupo') || error.response.data.error.includes('asiento')) {
                        mensajeError = `No se puede activar al alumno:\n\n${error.response.data.error}\n\n💡 Contacte con administración para gestionar los cupos disponibles.`;
                    } else {
                        mensajeError = error.response.data.error;
                    }
                } else if (error.response?.data?.message) {
                    mensajeError = error.response.data.message;
                } else if (error.message) {
                    mensajeError = error.message;
                }
                
                alert(mensajeError);
            }
        }
    };

    const filteredAlumnos = alumnos.filter(alumno => {
        if (!filtro) return true;
        const searchTerm = filtro.toLowerCase();
        return (
            alumno.dni_alumno?.toString().includes(searchTerm) ||
            alumno.nombre_alumno?.toLowerCase().includes(searchTerm) ||
            alumno.apellido_alumno?.toLowerCase().includes(searchTerm) ||
            (alumno.grado_info?.nombre_grado?.toLowerCase().includes(searchTerm)) ||
            (alumno.tutores_info && alumno.tutores_info.some(tutor => 
                tutor.nombre_completo?.toLowerCase().includes(searchTerm)
            ))
        );
    });

    if (loading) {
        return (
            <div className="container">
                <div className="loading">Cargando lista de alumnos...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <div className="error-message">{error}</div>
                <button onClick={() => navigate("/secretario")} className="btn btn-secondary">Volver</button>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="header">
                <button onClick={() => navigate("/secretario")} className="btn btn-secondary">
                    ← Volver al Dashboard
                </button>
                <h1>Lista de Alumnos</h1>
                <button onClick={() => navigate("/ListaAlumno-create")} className="btn btn-primary">
                    Nuevo Alumno
                </button>
            </div>

            {/* Barra de búsqueda */}
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Buscar por DNI, nombre, apellido, grado o tutor..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="search-input"
                />
                {filtro && (
                    <button onClick={() => setFiltro('')} className="btn btn-clear">
                        Limpiar
                    </button>
                )}
            </div>

            {/* Contador */}
            <div className="counter">
                Mostrando {filteredAlumnos.length} de {alumnos.length} alumnos
            </div>

            {/* TABLA EN LUGAR DE CARDS */}
            <div className="table-responsive">
                <table className="alumnos-table">
                    <thead>
                        <tr>
                            <th>DNI</th>
                            <th>Nombre Completo</th>
                            <th>Grado</th>
                            <th>Tutores</th>
                            <th>Colegio</th>
                            <th>Fecha Nac.</th>
                            <th>Género</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAlumnos.length > 0 ? (
                            filteredAlumnos.map((alumno) => (
                                <tr key={alumno.id_alumno} className={alumno.estado_alumno === 'Activo' ? 'activo' : 'inactivo'}>
                                    <td>{alumno.dni_alumno}</td>
                                    <td>
                                        <strong>{alumno.nombre_alumno} {alumno.apellido_alumno}</strong>
                                    </td>
                                    <td>{mostrarGrado(alumno)}</td>
                                    <td>
                                        <div className="tutores-list">
                                            {mostrarTutores(alumno).length > 0 ? (
                                                mostrarTutores(alumno).map((tutor) => (
                                                    <div key={`${alumno.dni_alumno}-${tutor.id_tutor}`} className="tutor-item-table">
                                                        <span className="tutor-name">
                                                            {tutor.nombre_completo} 
                                                            {tutor.parentesco && ` (${tutor.parentesco})`}
                                                        </span>
                                                        <div className="tutor-actions-table">
                                                            <button 
                                                                onClick={() => handleVerDetalleTutor(tutor.id_tutor, tutor.nombre_completo)}
                                                                className="btn btn-info btn-xs"
                                                                title="Ver detalles del tutor"
                                                            >
                                                                👁
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="no-tutor">No asignado</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>{mostrarColegio(alumno)}</td>
                                    <td>{formatearFechaLocal(alumno.fecha_nacimiento_alumno)}</td>
                                    <td>{alumno.genero_alumno === 'M' ? 'Masculino' : 'Femenino'}</td>
                                    <td>
                                        <span className={`status-badge ${alumno.estado_alumno === 'Activo' ? 'active' : 'inactive'}`}>
                                            {alumno.estado_alumno}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                onClick={() => navigate(`/ModificarAlumno/${alumno.dni_alumno}`)}
                                                className="btn btn-warning btn-sm"
                                                title="Modificar alumno"
                                            >
                                                
                                            </button>
                                            {alumno.estado_alumno === 'Activo' ? (
                                                <button
                                                    onClick={() => handleDesactivarAlumno(
                                                        alumno.dni_alumno, 
                                                        `${alumno.nombre_alumno} ${alumno.apellido_alumno}`,
                                                        mostrarGrado(alumno)
                                                    )}
                                                    className="btn btn-danger btn-sm"
                                                    title="Desactivar alumno"
                                                >
                                                    
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleActivarAlumno(
                                                        alumno.dni_alumno, 
                                                        `${alumno.nombre_alumno} ${alumno.apellido_alumno}`,
                                                        mostrarGrado(alumno)
                                                    )}
                                                    className="btn btn-success btn-sm"
                                                    title="Activar alumno"
                                                >
                                                    
                                                </button>
                                            )}
                                            {alumno.estado_alumno === 'Activo' && (
                                                <button
                                                    onClick={() => navigate(`/VincularTutorAlumno/${alumno.dni_alumno}`)}
                                                    className="btn btn-info btn-sm"
                                                    title="Vincular tutor"
                                                >
                                                    
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" className="no-results">
                                    {alumnos.length === 0 ? 'No hay alumnos registrados' : 'No se encontraron alumnos con los filtros aplicados'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AlumnoListTable;