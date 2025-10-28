// src/pages/preceptores_rectores/ResumenIncidencia.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Perfil from "../../components/Perfil";
import { useIncidencia } from '../../contexts/IncidenciaContext';
import { createMedida, getAllIncidencias, getAllLugares, getAllTiposIncidencias } from '../../api/preceptoresrectores.api';
import { obtenerIdEmpleadoLogueado } from './IdUsuarioLogueado';
import "../../style/RegistroIncidencia.css";

function ResumenIncidencia() {
  const navigate = useNavigate();
  const { formData, resetFormData } = useIncidencia();
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [catalogos, setCatalogos] = useState({
    tiposIncidencias: [],
    incidencias: [],
    lugares: []
  });

  // Crear una copia segura de formData
  const safeFormData = formData || {
    alumnos: [],
    tipo_incidencia: '',
    incidencia: '',
    id_lugar: '',
    descripcion_caso: ''
  };

  // Cargar catálogos para mostrar nombres
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [tiposRes, incidenciasRes, lugaresRes] = await Promise.all([
          getAllTiposIncidencias(),
          getAllIncidencias(),
          getAllLugares()
        ]);
        
        setCatalogos({
          tiposIncidencias: tiposRes.data,
          incidencias: incidenciasRes.data,
          lugares: lugaresRes.data
        });
      } catch (error) {
        console.error('Error cargando catálogos:', error);
      }
    };

    cargarCatalogos();
  }, []);

  // Funciones para obtener nombres
  const obtenerNombreTipoIncidencia = () => {
    if (!safeFormData.tipo_incidencia) return 'No especificado';
    const tipo = catalogos.tiposIncidencias.find(
      t => t.id_tipo_incidencia === parseInt(safeFormData.tipo_incidencia)
    );
    return tipo ? tipo.tipo_incidencia_nombre : 'No encontrado';
  };

  const obtenerNombreIncidenciaEspecifica = () => {
    if (!safeFormData.incidencia) return 'No especificado';
    const incidencia = catalogos.incidencias.find(
      i => i.id_incidencia === parseInt(safeFormData.incidencia)
    );
    return incidencia ? incidencia.nombre_incidencia : 'No encontrado';
  };

  const obtenerNombreLugar = () => {
    if (!safeFormData.id_lugar) return 'No especificado';
    const lugar = catalogos.lugares.find(
      l => l.id_lugar === parseInt(safeFormData.id_lugar)
    );
    return lugar ? lugar.nombre_lugar : 'No encontrado';
  };

  const obtenerNombreMedida = (tipoMedida) => {
    if (tipoMedida === "1") return "Llamado de Atención";
    if (tipoMedida === "2") return "Suspensión";
    return "No especificada";
  };

  console.log('📋 Datos en Resumen:', safeFormData);
  console.log('📚 Catálogos cargados:', catalogos);

  const handleRegistrar = async () => {
    try {
      setLoading(true);
      setMessage('');

      const idEmpleado = await obtenerIdEmpleadoLogueado();

      if (!safeFormData.alumnos || safeFormData.alumnos.length === 0) {
        throw new Error('No hay alumnos seleccionados');
      }

      const promises = safeFormData.alumnos.map(alumno => {
        const tipoMedida = alumno.tipo_medida || '1';
        const cantidadDias = tipoMedida === "2" ? parseInt(alumno.cantidad_dias) || 1 : 0;

        return createMedida({
          incidencia: parseInt(safeFormData.incidencia),
          id_alumno: parseInt(alumno.id_alumno),
          id_empleado: idEmpleado,
          id_lugar: parseInt(safeFormData.id_lugar),
          cantidad_dias: cantidadDias,
          descripcion_caso: safeFormData.descripcion_caso?.trim() || '',
        });
      });

      await Promise.all(promises);
      
      setMessage('✅ Incidencias registradas exitosamente!');
      
      setTimeout(() => {
        resetFormData();
        navigate("/preceptor_rector");
      }, 2000);
      
    } catch (error) {
      console.error('Error registrando incidencias:', error);
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('¿Está seguro de que desea cancelar? Se perderán todos los datos.')) {
      resetFormData();
      navigate('/preceptor_rector');
    }
  };

  const handleBack = () => {
    navigate('/preceptor_rector/DetallesIncidencia');
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <Perfil />
      </header>

      <main className="page-main">
        <div className='alumno-form-container'>
          <div className="form-header">
            <h2>Paso 3: Resumen y Confirmación</h2>
            <button onClick={handleCancel} className='form-btn btn-secondary'>
              Cancelar Proceso
            </button>
          </div>

          {message && (
            <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'}`}>
              {message}
            </div>
          )}

          <div className="alumno-form">
            {/* Resumen de alumnos y medidas */}
            <div className="form-section">
              <div className="summary-group">
                <h4>Alumnos Involucrados y Medidas Disciplinarias</h4>
                <div className="selected-students-summary">
                  {safeFormData.alumnos && safeFormData.alumnos.length > 0 ? (
                    safeFormData.alumnos.map(alumno => (
                      <div key={alumno.id_alumno} className="student-summary-card">
                        <div className="student-header">
                          <div className="student-info">
                            <h5>{alumno.nombre_alumno} {alumno.apellido_alumno}</h5>
                            <p>DNI: {alumno.dni_alumno} - Grado: {alumno.grado_info?.nombre_grado || 'No especificado'}</p>
                          </div>
                        </div>
                        <div className="medida-details">
                          <p><strong>Medida Disciplinaria:</strong> {obtenerNombreMedida(alumno.tipo_medida)}</p>
                          {alumno.tipo_medida === "2" && (
                            <p><strong>Días de Suspensión:</strong> {alumno.cantidad_dias || 0} día(s)</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-warning">⚠️ No hay alumnos seleccionados</p>
                  )}
                </div>
              </div>
            </div>

            {/* Resumen de incidencia */}
            <div className="form-section">
              <div className="summary-group">
                <h4>Detalles de la Incidencia</h4>
                <div className="summary-details">
                  <p>
                    <strong>Tipo de Incidencia:</strong> 
                    <span className="summary-value">
                      {obtenerNombreTipoIncidencia()}
                    </span>
                  </p>
                  
                  <p>
                    <strong>Incidencia Específica:</strong> 
                    <span className="summary-value">
                      {obtenerNombreIncidenciaEspecifica()}
                    </span>
                  </p>
                  
                  <p>
                    <strong>Lugar:</strong> 
                    <span className="summary-value">
                      {obtenerNombreLugar()}
                    </span>
                  </p>
                  
                  <p>
                    <strong>Descripción del Caso:</strong> 
                    <span className="summary-value">
                      {safeFormData.descripcion_caso || 'No especificada'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Verificación final */}
            <div className="form-section">
              <div className="emphasis-box">
                <p>
                  <strong>⚠️ Verificación:</strong> Revise cuidadosamente que toda la información sea correcta antes de confirmar. 
                  Una vez registrada, la incidencia quedará en el historial del alumno.
                </p>
              </div>
            </div>

            {/* Navegación */}
            <div className="navigation-buttons">
              <button 
                type="button" 
                className="form-btn btn-secondary"
                onClick={handleBack}
                disabled={loading}
              >
                ← Volver a Detalles
              </button>
              <button 
                type="button" 
                className="form-btn btn-primary"
                onClick={handleRegistrar}
                disabled={loading || !safeFormData.alumnos || safeFormData.alumnos.length === 0}
              >
                {loading ? '⏳ Registrando...' : 'Finalizar Registro'}
              </button>
            </div>
          </div>

          <div className="info-panel">
            <h4>📋 Proceso de Registro de Incidencia:</h4>
            <p>1. <strong>✓ Completado:</strong> Seleccionar alumnos involucrados</p>
            <p>2. <strong>✓ Completado:</strong> Completar detalles de la incidencia</p>
            <p>3. <strong>Paso actual:</strong> Revisar y confirmar registro</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ResumenIncidencia;