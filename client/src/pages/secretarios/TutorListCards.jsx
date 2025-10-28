import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getTutoresLista, desactivarTutorByDni, activarTutorByDni } from "../../api/secretario.api";
import "../../style/Tarjeta.css";

function TutorListCards() {
    const navigate = useNavigate();
    const [tutores, setTutores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtro, setFiltro] = useState('');

    useEffect(() => {
        async function loadTutores() {
            try {
                setLoading(true);
                console.log(' Cargando lista de tutores...');
                const response = await getTutoresLista();
                console.log(' Tutores cargados:', response.data);
                
                if (Array.isArray(response.data)) {
                    setTutores(response.data);
                } else {
                    setTutores([]);
                    setError('Formato de datos incorrecto');
                }
            } catch (error) {
                console.error(' Error cargando tutores:', error);
                setError('Error al cargar los tutores: ' + error.message);
                setTutores([]);
            } finally {
                setLoading(false);
            }
        }
        loadTutores();
    }, []);

    const filteredTutores = tutores.filter(tutor => {
        if (!filtro) return true;
        const searchTerm = filtro.toLowerCase();
        return (
            tutor.dni_tutor?.toString().includes(searchTerm) ||
            tutor.nombre_tutor?.toLowerCase().includes(searchTerm) ||
            tutor.apellido_tutor?.toLowerCase().includes(searchTerm) ||
            tutor.correo_tutor?.toLowerCase().includes(searchTerm)
        );
    });

    const handleDesactivarTutor = async (dni_tutor, nombre) => {
        if (window.confirm(`¿Está seguro de que desea desactivar al tutor ${nombre}? Esto impedirá que pueda iniciar sesión.`)) {
            try {
                await desactivarTutorByDni(dni_tutor);
                alert('Tutor desactivado correctamente');
                // Recargar lista
                const response = await getTutoresLista();
                if (Array.isArray(response.data)) {
                    setTutores(response.data);
                }
            } catch (error) {
                alert("Error al desactivar tutor: " + error.message);
            }
        }
    };

    const handleActivarTutor = async (dni_tutor, nombre) => {
        if (window.confirm(`¿Está seguro de que desea activar al tutor ${nombre}? Esto permitirá que pueda iniciar sesión.`)) {
            try {
                await activarTutorByDni(dni_tutor);
                alert('Tutor activado correctamente');
                // Recargar lista
                const response = await getTutoresLista();
                if (Array.isArray(response.data)) {
                    setTutores(response.data);
                }
            } catch (error) {
                alert("Error al activar tutor: " + error.message);
            }
        }
    };

    if (loading) {
        return (
            <div className="container">
                <div className="loading"> Cargando lista de tutores...</div>
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
                <div className="header-left">
                    <button onClick={() => navigate("/secretario")} className="btn btn-secondary">
                        ← Volver al Dashboard
                    </button>
                </div>
                <div className="header-center">
                    <h1>Lista de Tutores</h1>
                </div>
                <div className="header-right">
                    <button 
                        onClick={() => navigate("/registrar-tutor")} 
                        className="btn btn-primary"
                    >
                        Crear Nuevo Tutor
                    </button>
                </div>
            </div>

            {/* Barra de búsqueda */}
            <div className="search-bar">
                <input 
                    type="text" 
                    placeholder="Buscar por DNI, nombre, apellido o email..." 
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
                Mostrando {filteredTutores.length} de {tutores.length} tutores
            </div>

            {/* Grid de tarjetas */}
            <div className="cards-grid">
                {filteredTutores.length > 0 ? (
                    filteredTutores.map((tutor) => (
                        <div key={tutor.id_tutor} className="card tutor-card">
                            <div className="card-header">
                                <h3>{tutor.nombre_tutor} {tutor.apellido_tutor}</h3>
                                <span className={`badge ${tutor.estado_tutor === 'Activo' ? 'badge-success' : 'badge-danger'}`}>
                                    {tutor.estado_tutor}
                                </span>
                            </div>
                            <div className="card-body">
                                <div className="info-row">
                                    <span className="label">DNI:</span>
                                    <span className="value">{tutor.dni_tutor}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Teléfono:</span>
                                    <span className="value">{tutor.telefono_tutor}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Email:</span>
                                    <span className="value">{tutor.correo_tutor}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Género:</span>
                                    <span className="value">
                                        {tutor.genero_tutor === 'M' ? 'Masculino' : 'Femenino'}
                                    </span>
                                </div>
                            </div>
                            <div className="card-actions">
                                <button
                                    onClick={() => navigate(`/ModificarTutor/${tutor.id_tutor}`)}
                                    className="btn btn-warning"
                                >
                                    Modificar
                                </button>
                                {tutor.estado_tutor === 'Activo' ? (
                                    <button
                                        onClick={() => handleDesactivarTutor(tutor.dni_tutor, tutor.nombre_tutor + ' ' + tutor.apellido_tutor)}
                                        className="btn btn-danger"
                                    >
                                        Desactivar
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleActivarTutor(tutor.dni_tutor, tutor.nombre_tutor + ' ' + tutor.apellido_tutor)}
                                        className="btn btn-success"
                                    >
                                        Activar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-results">
                        {tutores.length === 0 ? 'No hay tutores registrados' : 'No se encontraron tutores con los filtros aplicados'}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TutorListCards;