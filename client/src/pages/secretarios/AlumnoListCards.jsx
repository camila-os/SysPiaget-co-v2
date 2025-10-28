import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
    getAlumnosLista,
    desactivarAlumnoByDni,
    activarAlumnoByDni,
    deleteAlumnoXTutor,
    getAlumnosXTutorByAlumnoDni
} from "../../api/secretario.api";
import "../../style/Tarjeta.css";
import "../../style/tutor-actions.css"

function AlumnoListCards() {
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
            // Si la fecha ya está en formato YYYY-MM-DD, usar directamente
            if (typeof fechaString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaString)) {
                const [año, mes, dia] = fechaString.split('-');
                return `${dia}/${mes}/${año}`;
            }
            
            // Para otros formatos, usar Date
            const fecha = new Date(fechaString);
            
            // Validar que la fecha sea válida
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
                console.log(' Cargando lista de alumnos...');
                
                const response = await getAlumnosLista();
                console.log(' Alumnos cargados:', response.data);
                
                if (response.data && response.data.length > 0) {
                    const primerAlumno = response.data[0];
                    console.log(' Estructura COMPLETA del primer alumno:', primerAlumno);
                    
                    if (primerAlumno.tutores_info) {
                        console.log(' Tutores encontrados:', primerAlumno.tutores_info.length);
                        primerAlumno.tutores_info.forEach((tutor, index) => {
                            console.log(` Tutor ${index}:`, tutor);
                        });
                    }
                }
                
                if (Array.isArray(response.data)) {
                    setAlumnos(response.data);
                } else {
                    setAlumnos([]);
                    setError('Formato de datos incorrecto');
                }
                
            } catch (error) {
                console.error(' Error cargando alumnos:', error);
                setError('Error al cargar los alumnos: ' + error.message);
                setAlumnos([]);
            } finally {
                setLoading(false);
            }
        }
        loadAlumnos();
    }, []);

    //  FUNCIÓN MEJORADA PARA OBTENER EL ID DE LA RELACIÓN
    const obtenerIdRelacionTutor = async (alumnoDni, tutorId) => {
        try {
            console.log(` Buscando ID de relación para alumno DNI: ${alumnoDni}, tutor ID: ${tutorId}`);
            
            //  USAR EL ENDPOINT ESPECÍFICO PARA RELACIONES ALUMNO-TUTOR
            const relacionesResponse = await getAlumnosXTutorByAlumnoDni(alumnoDni);
            console.log(' Relaciones alumno-tutor encontradas:', relacionesResponse.data);
            
            if (relacionesResponse.data && relacionesResponse.data.length > 0) {
                // Buscar la relación específica con este tutor
                const relacionEncontrada = relacionesResponse.data.find(
                    relacion => relacion.id_tutor === tutorId
                );
                
                if (relacionEncontrada) {
                    console.log(' Relación encontrada:', relacionEncontrada);
                    
                    // El ID de la relación puede estar en diferentes campos
                    const idRelacion = relacionEncontrada.id_alumno_x_tutor || 
                                      relacionEncontrada.id ||
                                      relacionEncontrada.relacion_id;
                    
                    if (idRelacion) {
                        console.log(' ID de relación encontrado:', idRelacion);
                        return idRelacion;
                    } else {
                        console.log(' Relación encontrada pero sin ID:', relacionEncontrada);
                    }
                } else {
                    console.log(` No se encontró relación con tutor ID: ${tutorId}`);
                }
            } else {
                console.log(' No se encontraron relaciones para este alumno');
            }
            
            return null;
            
        } catch (error) {
            console.error(' Error obteniendo ID de relación:', error);
            return null;
        }
    };

    //  FUNCIÓN MEJORADA PARA ELIMINAR RELACIÓN CON TUTOR
    const handleEliminarRelacionTutor = async (alumnoDni, tutorId, alumnoNombre, tutorNombre) => {
        console.log(' Eliminando relación:', { alumnoDni, tutorId, alumnoNombre, tutorNombre });
        
        const confirmacion = window.confirm(
            `¿Está seguro de que desea eliminar la relación entre:\n\n` +
            `Alumno: ${alumnoNombre}\n` +
            `Tutor: ${tutorNombre}\n\n` +
            ` Esta acción eliminará permanentemente la relación, pero NO eliminará al tutor del sistema.\n\n` +
            `¿Continuar?`
        );
        
        if (!confirmacion) return;
        
        try {
            setEliminandoRelacion(`${alumnoDni}-${tutorId}`);
            
            console.log(` Buscando ID de relación para eliminar...`);
            
            //  OBTENER EL ID DE LA RELACIÓN
            const idRelacion = await obtenerIdRelacionTutor(alumnoDni, tutorId);
            
            if (!idRelacion) {
                // Si no encontramos el ID, intentar método alternativo
                console.log(' Intentando método alternativo para encontrar ID...');
                
                // Buscar en los datos actuales del alumno
                const alumno = alumnos.find(a => a.dni_alumno === alumnoDni);
                if (!alumno) {
                    throw new Error('No se encontró el alumno');
                }
                
                // Buscar el tutor en la lista de tutores del alumno
                const tutorRelacion = alumno.tutores_info?.find(t => t.id_tutor === tutorId);
                if (tutorRelacion) {
                    console.log(' Tutor relación encontrado en datos locales:', tutorRelacion);
                    
                    // Intentar encontrar el ID en diferentes campos posibles
                    const posiblesIds = [
                        tutorRelacion.id_alumno_x_tutor,
                        tutorRelacion.relacion_id,
                        tutorRelacion.id,
                        tutorRelacion.alumno_x_tutor_id
                    ];
                    
                    const idEncontrado = posiblesIds.find(id => id !== undefined && id !== null);
                    
                    if (idEncontrado) {
                        console.log(' ID de relación encontrado en campos alternativos:', idEncontrado);
                        await eliminarRelacionPorId(idEncontrado, alumnoNombre, tutorNombre);
                        return;
                    }
                }
                
                throw new Error('No se pudo identificar la relación a eliminar. Por favor, use la opción de modificar alumno.');
            } else {
                await eliminarRelacionPorId(idRelacion, alumnoNombre, tutorNombre);
            }
            
        } catch (error) {
            console.error(' Error eliminando relación:', error);
            
            let mensajeError = 'Error al eliminar la relación';
            
            if (error.response?.data?.error) {
                mensajeError = error.response.data.error;
            } else if (error.response?.data?.message) {
                mensajeError = error.response.data.message;
            } else if (error.message) {
                mensajeError = error.message;
            }
            
            alert(` ${mensajeError}\n\n💡 Si el problema persiste, intente modificar el alumno para gestionar las relaciones.`);
            
        } finally {
            setEliminandoRelacion(null);
        }
    };

    //  FUNCIÓN AUXILIAR PARA ELIMINAR RELACIÓN POR ID
    const eliminarRelacionPorId = async (idRelacion, alumnoNombre, tutorNombre) => {
        console.log(` Eliminando relación ID: ${idRelacion}`);
        
        const response = await deleteAlumnoXTutor(idRelacion);
        
        alert("Relación eliminada correctamente");
        
        // Recargar la lista de alumnos para reflejar los cambios
        const alumnosResponse = await getAlumnosLista();
        if (Array.isArray(alumnosResponse.data)) {
            setAlumnos(alumnosResponse.data);
        }
    };

    //  FUNCIONES CORREGIDAS PARA MOSTRAR DATOS
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

    //  FUNCIÓN PARA VER DETALLES DEL TUTOR
    const handleVerDetalleTutor = (tutorId, tutorNombre) => {
        if (tutorId) {
            navigate(`/DetalleTutor/${tutorId}`);
        } else {
            alert(`No se puede ver los detalles del tutor: ${tutorNombre}`);
        }
    };

    //  FUNCIÓN MEJORADA PARA DESACTIVAR ALUMNO LIBERANDO ASIENTO
    const handleDesactivarAlumno = async (dni_alumno, nombre, grado) => {
        const mensaje = grado && grado !== 'No asignado' 
            ? `¿Está seguro de que desea DESACTIVAR al ayumno ${nombre}?\n\n Esto liberará un asiento en el grado ${grado}.`
            : `¿Está seguro de que desea DESACTIVAR al alumno ${nombre}?`;

        if (window.confirm(mensaje)) {
            try {
                // Usar la función existente que ya maneja la liberación de asientos
                const response = await desactivarAlumnoByDni(dni_alumno);
                
                let mensajeExito = ` Alumno ${nombre} desactivado correctamente`;
                if (response.data.asiento_liberado && grado && grado !== 'No asignado') {
                    mensajeExito += `\n Se liberó un asiento en ${grado}`;
                }
                
                alert(mensajeExito);
                
                // Recargar lista para reflejar cambios
                const alumnosResponse = await getAlumnosLista();
                if (Array.isArray(alumnosResponse.data)) {
                    setAlumnos(alumnosResponse.data);
                }
            } catch (error) {
                console.error('Error desactivando alumno:', error);
                let mensajeError = ' Error al desactivar alumno';
                
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

    //  FUNCIÓN MEJORADA PARA ACTIVAR ALUMNO ASIGNANDO ASIENTO
    const handleActivarAlumno = async (dni_alumno, nombre, grado) => {
        const mensaje = grado && grado !== 'No asignado' 
            ? `¿Está seguro de que desea ACTIVAR al alumno ${nombre}?\n\n Esto ocupará un asiento en el grado ${grado}.`
            : `¿Está seguro de que desea ACTIVAR al alumno ${nombre}?`;

        if (window.confirm(mensaje)) {
            try {
                // Usar la función existente que ya maneja la asignación de asientos
                const response = await activarAlumnoByDni(dni_alumno);
                
                let mensajeExito = ` Alumno ${nombre} activado correctamente`;
                if (response.data.asiento_ocupado && grado && grado !== 'No asignado') {
                    mensajeExito += `\n Se ocupó un asiento en ${grado}`;
                }
                
                alert(mensajeExito);
                
                // Recargar lista
                const alumnosResponse = await getAlumnosLista();
                if (Array.isArray(alumnosResponse.data)) {
                    setAlumnos(alumnosResponse.data);
                }
            } catch (error) {
                console.error('Error activando alumno:', error);
                let mensajeError = ' Error al activar alumno';
                
                if (error.response?.data?.error) {
                    if (error.response.data.error.includes('capacidad') || error.response.data.error.includes('cupo') || error.response.data.error.includes('asiento')) {
                        mensajeError = ` No se puede activar al alumno:\n\n${error.response.data.error}\n\n💡 Contacte con administración para gestionar los cupos disponibles.`;
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
                <div className="loading"> Cargando lista de alumnos...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <div className="error-message"> {error}</div>
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
                <h1> Lista de Alumnos</h1>
                <button onClick={() => navigate("/ListaAlumno-create")} className="btn btn-primary">
                     Nuevo Alumno
                </button>
            </div>

            {/* Barra de búsqueda */}
            <div className="search-bar">
                <input
                    type="text"
                    placeholder=" Buscar por DNI, nombre, apellido, grado o tutor..."
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

            {/* Grid de tarjetas */}
            <div className="cards-grid">
                {filteredAlumnos.length > 0 ? (
                    filteredAlumnos.map((alumno) => (
                        <div key={alumno.id_alumno} className="card alumno-card">
                            <div className="card-header">
                                <h3>{alumno.nombre_alumno} {alumno.apellido_alumno}</h3>
                                <span className={`badge ${alumno.estado_alumno === 'Activo' ? 'badge-success' : 'badge-danger'}`}>
                                    {alumno.estado_alumno === 'Activo' ? ' Activo' : ' Inactivo'}
                                </span>
                            </div>
                            
                            <div className="card-body">
                                <div className="info-row">
                                    <span className="label"> DNI:</span>
                                    <span className="value">{alumno.dni_alumno}</span>
                                </div>
                                
                                <div className="info-row">
                                    <span className="label"> Grado:</span>
                                    <span className="value">{mostrarGrado(alumno)}</span>
                                </div>
                                
                                {/* TUTORES CON BOTONES DE ACCIÓN */}
                                <div className="info-row">
                                    <span className="label"> Tutores:</span>
                                    <div className="tutores-container">
                                        {mostrarTutores(alumno).length > 0 ? (
                                            mostrarTutores(alumno).map((tutor) => (
                                                <div key={`${alumno.dni_alumno}-${tutor.id_tutor}`} className="tutor-item">
                                                    <div className="tutor-info">
                                                        <span className="tutor-name">
                                                            {tutor.nombre_completo} 
                                                            {tutor.parentesco && ` (${tutor.parentesco})`}
                                                        </span>
                                                    </div>
                                                    <div className="tutor-actions">
                                                        {/* BOTÓN VER DETALLES */}
                                                        <button 
                                                            onClick={() => handleVerDetalleTutor(tutor.id_tutor, tutor.nombre_completo)}
                                                            className="btn btn-info btn-sm"
                                                            title="Ver detalles del tutor"
                                                        >
                                                             Ver
                                                        </button>
                                                        
                                                        {/* BOTÓN ELIMINAR RELACIÓN - SOLO SI HAY MÁS DE UN TUTOR */}
                                                        {mostrarTutores(alumno).length > 1 && (
                                                            <button 
                                                                onClick={() => handleEliminarRelacionTutor(
                                                                    alumno.dni_alumno,
                                                                    tutor.id_tutor,
                                                                    `${alumno.nombre_alumno} ${alumno.apellido_alumno}`,
                                                                    tutor.nombre_completo
                                                                )}
                                                                className="btn btn-danger btn-sm"
                                                                disabled={eliminandoRelacion === `${alumno.dni_alumno}-${tutor.id_tutor}`}
                                                                title="Eliminar relación con este tutor"
                                                            >
                                                                {eliminandoRelacion === `${alumno.dni_alumno}-${tutor.id_tutor}` ? ' Eliminando...' : ' Eliminar'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <span className="value no-tutor"> No asignado</span>
                                        )}
                                    </div>
                                </div>

                                <div className="info-row">
                                    <span className="label"> Colegio:</span>
                                    <span className="value">{mostrarColegio(alumno)}</span>
                                </div>
                                
                                <div className="info-row">
                                    <span className="label"> Fecha Nac.:</span>
                                    <span className="value">
                                        {formatearFechaLocal(alumno.fecha_nacimiento_alumno)}
                                    </span>
                                </div>
                                
                                <div className="info-row">
                                    <span className="label"> Género:</span>
                                    <span className="value">
                                        {alumno.genero_alumno === 'M' ? ' Masculino' : ' Femenino'}
                                    </span>
                                </div>

                                {alumno.edad && (
                                    <div className="info-row">
                                        <span className="label"> Edad:</span>
                                        <span className="value">{alumno.edad} años</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="card-actions">
                                <button
                                    onClick={() => navigate(`/ModificarAlumno/${alumno.dni_alumno}`)}
                                    className="btn btn-warning"
                                >
                                     Modificar
                                </button>
                                {alumno.estado_alumno === 'Activo' ? (
                                    <button
                                        onClick={() => handleDesactivarAlumno(
                                            alumno.dni_alumno, 
                                            `${alumno.nombre_alumno} ${alumno.apellido_alumno}`,
                                            mostrarGrado(alumno)
                                        )}
                                        className="btn btn-danger"
                                    >
                                         Desactivar
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleActivarAlumno(
                                            alumno.dni_alumno, 
                                            `${alumno.nombre_alumno} ${alumno.apellido_alumno}`,
                                            mostrarGrado(alumno)
                                        )}
                                        className="btn btn-success"
                                    >
                                         Activar
                                    </button>
                                )}
                                {alumno.estado_alumno === 'Activo' && (
                                    <button
                                        onClick={() => navigate(`/VincularTutorAlumno/${alumno.dni_alumno}`)}
                                        className="btn btn-info"
                                    >
                                         Vincular Tutor
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-results">
                        {alumnos.length === 0 ? 'No hay alumnos registrados' : ' No se encontraron alumnos con los filtros aplicados'}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AlumnoListCards;