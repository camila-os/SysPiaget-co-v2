import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Perfil from "../../components/Perfil";
import { getAlumnosLista } from '../../api/secretario.api';
import { getGrados } from '../../api/preceptoresrectores.api';
import { useIncidencia } from '../../contexts/IncidenciaContext';
import "../../style/RegistroIncidencia.css";

function SeleccionAlumnos() {
  const navigate = useNavigate();
  const { formData, setFormData, resetFormData } = useIncidencia(); // ✅ USAR CONTEXT CORRECTAMENTE
  
  const { register, handleSubmit, watch } = useForm({
    defaultValues: formData?.filtros || {}
  });

  const [alumnos, setAlumnos] = useState([]);
  const [alumnosFiltrados, setAlumnosFiltrados] = useState([]);
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState([]);
  const [grados, setGrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);

  const gradoSeleccionado = watch('grado');

  // Cargar datos iniciales
  useEffect(() => {
    cargarAlumnosYGrados();
    
    // ✅ CARGAR ALUMNOS SELECCIONADOS PREVIOS DEL CONTEXT
    if (formData?.alumnos && formData.alumnos.length > 0) {
      // ✅ LIMITAR A 5 ALUMNOS MÁXIMO
      const alumnosLimitados = formData.alumnos.slice(0, 5);
      setAlumnosSeleccionados(alumnosLimitados);
    }
  }, []);

  const cargarAlumnosYGrados = async () => {
    try {
      setLoading(true);
      
      const [alumnosRes, gradosRes] = await Promise.all([
        getAlumnosLista(),
        getGrados()
      ]);
      
      setAlumnos(alumnosRes.data);
      setAlumnosFiltrados(alumnosRes.data);
      setGrados(gradosRes.data);
      
      console.log('✅ Alumnos cargados:', alumnosRes.data.length);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIONES DE FILTRADO MEJORADAS - BÚSQUEDA SIN PALABRAS PARCIALES
  const handleFiltroChange = (e) => {
    const nuevoFiltro = e.target.value;
    setFiltro(nuevoFiltro);
    
    // Mostrar resultados solo si hay texto en el filtro o hay un grado seleccionado
    const tieneFiltros = nuevoFiltro.trim() !== '' || (gradoSeleccionado && gradoSeleccionado !== 'todos');
    setMostrarResultados(tieneFiltros);
  };

  const limpiarFiltro = () => {
    setFiltro('');
    setMostrarResultados(false);
  };

  const mostrarGrado = (alumno) => {
    if (alumno.grado_info && alumno.grado_info.nombre_grado) {
      return alumno.grado_info.nombre_grado;
    }
    return 'No asignado';
  };

  // ✅ FUNCIÓN SIMPLIFICADA DE BÚSQUEDA - SIN PALABRAS PARCIALES
  const buscarAlumnos = (terminoBusqueda, listaAlumnos) => {
    if (!terminoBusqueda.trim()) {
      return listaAlumnos;
    }

    const termino = terminoBusqueda.toLowerCase().trim();
    
    return listaAlumnos.filter(alumno => {
      const dni = alumno.dni_alumno?.toString() || '';
      const nombre = alumno.nombre_alumno?.toLowerCase() || '';
      const apellido = alumno.apellido_alumno?.toLowerCase() || '';
      const nombreCompleto = `${nombre} ${apellido}`.trim();
      const nombreCompletoInvertido = `${apellido} ${nombre}`.trim();
      
      // ✅ BÚSQUEDA POR DNI (exacta)
      if (dni.includes(termino)) {
        return true;
      }
      
      // ✅ BÚSQUEDA POR NOMBRE COMPLETO (exacto)
      if (nombreCompleto.includes(termino) || nombreCompletoInvertido.includes(termino)) {
        return true;
      }
      
      // ✅ BÚSQUEDA POR NOMBRE O APELLIDO INDIVIDUAL (exacto)
      if (nombre.includes(termino) || apellido.includes(termino)) {
        return true;
      }
      
      return false;
    });
  };

  // Aplicar filtros combinados
  useEffect(() => {
    let resultados = [...alumnos];
    
    // ✅ APLICAR FILTRO DE TEXTO SIMPLIFICADO
    if (filtro) {
      resultados = buscarAlumnos(filtro, resultados);
    }
    
    // ✅ FILTRO DE GRADO
    if (gradoSeleccionado && gradoSeleccionado !== 'todos') {
      resultados = resultados.filter(alumno => 
        alumno.id_grado === parseInt(gradoSeleccionado) ||
        alumno.grado_info?.id_grado === parseInt(gradoSeleccionado)
      );
    }
    
    setAlumnosFiltrados(resultados);
    
    // Mostrar resultados si hay filtros activos
    const tieneFiltros = filtro.trim() !== '' || (gradoSeleccionado && gradoSeleccionado !== 'todos');
    setMostrarResultados(tieneFiltros);
  }, [filtro, gradoSeleccionado, alumnos]);

  const agregarAlumno = (alumno) => {
    // ✅ VERIFICAR LÍMITE DE 5 ALUMNOS
    if (alumnosSeleccionados.length >= 5) {
      alert('Máximo 5 alumnos por incidencia');
      return;
    }
    
    if (!alumnosSeleccionados.find(a => a.id_alumno === alumno.id_alumno)) {
      const nuevosAlumnos = [...alumnosSeleccionados, alumno];
      setAlumnosSeleccionados(nuevosAlumnos);
      
      // ✅ ACTUALIZAR CONTEXT
      setFormData({
        alumnos: nuevosAlumnos
      });
    }
  };

  const eliminarAlumno = (idAlumno) => {
    const nuevosAlumnos = alumnosSeleccionados.filter(a => a.id_alumno !== idAlumno);
    setAlumnosSeleccionados(nuevosAlumnos);
    
    // ✅ ACTUALIZAR CONTEXT
    setFormData({
      alumnos: nuevosAlumnos
    });
  };

  const onSubmit = (data) => {
    console.log('🔍 Iniciando onSubmit...');
    
    if (alumnosSeleccionados.length === 0) {
      alert('Debe seleccionar al menos un alumno');
      return;
    }
    
    // ✅ ACTUALIZAR CONTEXT (solo navega, no limpia datos)
    setFormData({
      filtros: data,
      alumnos: alumnosSeleccionados
    });
    
    console.log('🔄 Navegando a DetallesIncidencia...');
    navigate('/preceptor_rector/DetallesIncidencia');
  };

  const handleCancel = () => {
    if (window.confirm('¿Está seguro de que desea cancelar? Se perderán todos los datos.')) {
      resetFormData(); // ✅ LIMPIAR DATOS AL CANCELAR
      navigate('/preceptor_rector');
    }
  };

  // ✅ FUNCIÓN PARA VOLVER AL PANEL (sin limpiar datos)
  const handleVolverPanel = () => {
    // Solo navega, no limpia los datos
    navigate('/preceptor_rector');
  };

  if (loading) {
    return (
      <div className="page-container">
        <header className="page-header">
          <Perfil />
        </header>
        <main className="page-main">
          <div className='alumno-form-container'>
            <p className="loading-text">🔄 Cargando datos...</p>
          </div>
        </main>
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
            <h2>Paso 1: Selección de Alumnos</h2>
            <button 
              type="button"
              onClick={handleCancel} 
              className='form-btn btn-secondary'
            >
              Cancelar Proceso
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="alumno-form-grid">
            {/* Sección de Búsqueda y Filtros // Columna izquierda*/}
            <div className="left-column">
              <div className="form-section">
                <h3>Buscar y Filtrar Alumnos</h3>
                
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Buscar Alumno</label>
                    <div className="search-container">
                      <div className="search-input-wrapper">
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Buscar por DNI, nombre y apellido..."
                          value={filtro}
                          onChange={handleFiltroChange}
                        />
                      </div>
                      {filtro && (
                        <button 
                          type="button"
                          onClick={limpiarFiltro}
                          className="form-btn btn-secondary"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Filtrar por Año</label>
                    <select 
                      className="form-select" 
                      {...register('grado')}
                      onChange={(e) => {
                        // Actualizar el valor del select
                        register('grado').onChange(e);
                        // Mostrar resultados si se selecciona un grado específico
                        const tieneFiltros = filtro.trim() !== '' || (e.target.value && e.target.value !== 'todos');
                        setMostrarResultados(tieneFiltros);
                      }}
                    >
                      <option value="todos">Todos los años</option>
                      {grados.map(grado => (
                        <option key={grado.id_grado} value={grado.id_grado}>
                          {grado.nombre_grado}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="counter-results">
                  {mostrarResultados ? (
                    <>
                      Mostrando {alumnosFiltrados.length} de {alumnos.length} alumnos
                    </>
                  ) : (
                    <>
                      {alumnos.length} alumnos disponibles
                    </>
                  )}
                </div>
              </div>

              {/* Resultados de Búsqueda - Solo se muestra cuando hay filtros activos */}
              {mostrarResultados && (
                <div className="form-section">
                  <h3>Resultados de Búsqueda</h3>
                  
                  {alumnosFiltrados.length === 0 ? (
                    <div className="no-results-message">
                      No se encontraron alumnos con los filtros aplicados
                    </div>
                  ) : (
                    <div className="table-responsive-wrapper">
                      <table className="results-table">
                        <thead>
                          <tr>
                            <th>DNI</th>
                            <th>Nombre Completo</th>
                            <th>Grado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {alumnosFiltrados.map(alumno => (
                            <tr 
                              key={alumno.id_alumno}
                              className={alumnosSeleccionados.find(a => a.id_alumno === alumno.id_alumno) ? 'selected-row' : ''}
                            >
                              <td>{alumno.dni_alumno}</td>
                              <td>
                                {alumno.nombre_alumno} {alumno.apellido_alumno}
                              </td>
                              <td>{mostrarGrado(alumno)}</td>
                              <td>
                                <button
                                  type="button"
                                  className={`table-btn ${
                                    alumnosSeleccionados.find(a => a.id_alumno === alumno.id_alumno) 
                                      ? 'btn-added' 
                                      : 'btn-add'
                                  }`}
                                  onClick={() => agregarAlumno(alumno)}
                                  disabled={
                                    alumnosSeleccionados.find(a => a.id_alumno === alumno.id_alumno) ||
                                    alumno.estado_alumno !== 'Activo' ||
                                    alumnosSeleccionados.length >= 5 // ✅ DESHABILITAR SI LLEGÓ AL LÍMITE
                                  }
                                  title={
                                    alumno.estado_alumno !== 'Activo' ? 'Alumno inactivo - no se puede seleccionar' :
                                    alumnosSeleccionados.length >= 5 ? 'Máximo 5 alumnos alcanzado' :
                                    'Agregar alumno'
                                  }
                                >
                                  {alumnosSeleccionados.find(a => a.id_alumno === alumno.id_alumno) ? 'Agregado' : 'Agregar'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Mensaje cuando no hay filtros activos */}
              {!mostrarResultados && (
                <div className="form-section">
                  <div className="no-search-message">
                    <h3>Resultados de Búsqueda</h3>
                    <p>Ingrese un término de búsqueda o seleccione un grado específico para ver los resultados.</p>
                    <div className="search-tips">
                      <strong>Puede buscar por:</strong>
                      <ul>
                        <li>DNI</li>
                        <li>Nombre y Apellido</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Columna Derecha */}
            <div className="right-column">
              {/* Alumnos Seleccionados */}
              <div className="form-section">
                <h3>Alumnos Seleccionados</h3>
                
                {alumnosSeleccionados.length === 0 ? (
                  <div className="no-selection-message">
                    No hay alumnos seleccionados
                  </div>
                ) : (
                  <div className="selected-students-container">
                    {alumnosSeleccionados.map(alumno => (
                      <div key={alumno.id_alumno} className="student-tag">
                        <span>
                          {alumno.nombre_alumno} {alumno.apellido_alumno} - {alumno.dni_alumno} - {mostrarGrado(alumno)}
                        </span>
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => eliminarAlumno(alumno.id_alumno)}
                          aria-label="Eliminar alumno"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Botones de navegación */}
            <div className="navigation-buttons">
              <button 
                type="button" 
                className="form-btn btn-secondary"
                onClick={handleVolverPanel} // ✅ USAR FUNCIÓN QUE NO LIMPIA DATOS
              >
                ← Volver al Panel
              </button>
              <button 
                type="submit" 
                className="form-btn btn-primary"
                disabled={alumnosSeleccionados.length === 0}
              >
                Continuar a Detalles →
              </button>
            </div>
          </form>

          <div className="info-panel">
            <h4>📋 Proceso de Registro de Incidencia:</h4>
            <p>1. <strong>Paso actual:</strong> Seleccionar alumnos involucrados</p>
            <p>2. <strong>Siguiente paso:</strong> Completar detalles de la incidencia</p>
            <p>3. <strong>Finalizar:</strong> Guardar incidencia</p>
            <p><strong>Nota:</strong> Máximo 5 alumnos por incidencia</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SeleccionAlumnos;