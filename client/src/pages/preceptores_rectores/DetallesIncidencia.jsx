import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Perfil from "../../components/Perfil";
import { useIncidencia } from '../../contexts/IncidenciaContext';
import { getAllIncidencias, getAllLugares, getAllTiposIncidencias } from '../../api/preceptoresrectores.api';
import "../../style/RegistroIncidencia.css";

function DetallesIncidencia() {
  const navigate = useNavigate();
  
  const { formData, setFormData, resetFormData } = useIncidencia();
  
  // ✅ ESTADO PARA MEDIDAS INDIVIDUALES POR ALUMNO - INICIALIZAR DESDE CONTEXT
  const [medidasPorAlumno, setMedidasPorAlumno] = useState(() => {
    if (formData?.medidasPorAlumno && Object.keys(formData.medidasPorAlumno).length > 0) {
      return formData.medidasPorAlumno;
    } else if (formData?.alumnos) {
      const inicial = {};
      formData.alumnos.forEach(alumno => {
        inicial[alumno.id_alumno] = {
          tipo_medida: '1',
          cantidad_dias: ''
        };
      });
      return inicial;
    }
    return {};
  });

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      tipo_incidencia: formData?.tipo_incidencia || '',
      incidencia: formData?.incidencia || '',
      id_lugar: formData?.id_lugar || '',
      descripcion_caso: formData?.descripcion_caso || ''
    }
  });

  const [incidencias, setIncidencias] = useState([]);
  const [tiposIncidencias, setTiposIncidencias] = useState([]);
  const [lugares, setLugares] = useState([]);
  const [incidenciasFiltradas, setIncidenciasFiltradas] = useState([]);
  const [loading, setLoading] = useState(false);

  const tipoIncidenciaSeleccionado = watch('tipo_incidencia');
  const incidenciaSeleccionada = watch('incidencia');

  useEffect(() => {
    cargarDatos();
  }, []);

  // ✅ ACTUALIZAR CONTEXT CUANDO CAMBIAN LAS MEDIDAS - VERSIÓN CORREGIDA
  useEffect(() => {
    const medidasActuales = JSON.stringify(medidasPorAlumno);
    const medidasPrevias = JSON.stringify(formData?.medidasPorAlumno || {});
    
    if (medidasActuales !== medidasPrevias && Object.keys(medidasPorAlumno).length > 0) {
      console.log('💾 Guardando medidas en contexto:', medidasPorAlumno);
      setFormData({
        medidasPorAlumno: medidasPorAlumno
      });
    }
  }, [medidasPorAlumno, formData?.medidasPorAlumno, setFormData]);

  // ✅ CORREGIDO: FILTRADO DE INCIDENCIAS MÁS ROBUSTO
  useEffect(() => {
    if (!tipoIncidenciaSeleccionado) {
      // ✅ MOSTRAR TODAS LAS INCIDENCIAS CUANDO NO HAY TIPO SELECCIONADO
      setIncidenciasFiltradas(incidencias);
    } else {
      // ✅ FILTRAR POR TIPO CUANDO HAY UN TIPO SELECCIONADO
      filtrarIncidenciasPorTipo(tipoIncidenciaSeleccionado);
    }
  }, [tipoIncidenciaSeleccionado, incidencias]);

  // ✅ NUEVO: SINCRONIZAR INCIDENCIA ESPECÍFICA CON EL TIPO SELECCIONADO
  useEffect(() => {
    if (incidenciaSeleccionada && tipoIncidenciaSeleccionado) {
      const incidenciaEncontrada = incidencias.find(inc => 
        inc.id_incidencia === parseInt(incidenciaSeleccionada)
      );
      
      if (incidenciaEncontrada) {
        // Buscar el campo que contiene el ID del tipo
        const campoPosible = Object.keys(incidenciaEncontrada).find(key => 
          key.toLowerCase().includes('tipo') && 
          typeof incidenciaEncontrada[key] === 'number'
        );

        if (campoPosible && incidenciaEncontrada[campoPosible]) {
          const idTipoIncidencia = incidenciaEncontrada[campoPosible];
          const idTipoSeleccionado = parseInt(tipoIncidenciaSeleccionado);
          
          // ✅ VERIFICAR SI LA INCIDENCIA PERTENECE AL TIPO SELECCIONADO
          if (idTipoIncidencia !== idTipoSeleccionado) {
            console.warn('⚠️ Incidencia no coincide con el tipo seleccionado. Limpiando selección...');
            setValue('incidencia', '');
          }
        }
      }
    }
  }, [tipoIncidenciaSeleccionado, incidenciaSeleccionada, incidencias, setValue]);

  // ✅ NUEVO: CUANDO SE SELECCIONA UNA INCIDENCIA ESPECÍFICA, COMPLETAR AUTOMÁTICAMENTE EL TIPO
  useEffect(() => {
    if (incidenciaSeleccionada && !tipoIncidenciaSeleccionado) {
      const incidenciaEncontrada = incidencias.find(inc => 
        inc.id_incidencia === parseInt(incidenciaSeleccionada)
      );
      
      if (incidenciaEncontrada) {
        const campoPosible = Object.keys(incidenciaEncontrada).find(key => 
          key.toLowerCase().includes('tipo') && 
          typeof incidenciaEncontrada[key] === 'number'
        );

        if (campoPosible && incidenciaEncontrada[campoPosible]) {
          const idTipoIncidencia = incidenciaEncontrada[campoPosible];
          
          setValue('tipo_incidencia', idTipoIncidencia.toString());
          console.log('✅ Tipo de incidencia actualizado automáticamente:', idTipoIncidencia);
        }
      }
    }
  }, [incidenciaSeleccionada, tipoIncidenciaSeleccionado, incidencias, setValue]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [incidenciasRes, tiposRes, lugaresRes] = await Promise.all([
        getAllIncidencias(),
        getAllTiposIncidencias(),
        getAllLugares()
      ]);
      
      setIncidencias(incidenciasRes.data);
      setTiposIncidencias(tiposRes.data);
      setLugares(lugaresRes.data);
      
      // ✅ INICIALMENTE MOSTRAR TODAS LAS INCIDENCIAS
      setIncidenciasFiltradas(incidenciasRes.data);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarIncidenciasPorTipo = (idTipoIncidencia) => {
    const idTipo = parseInt(idTipoIncidencia);
    
    if (incidencias.length === 0) {
      setIncidenciasFiltradas([]);
      return;
    }

    // Buscar el campo que contiene el ID del tipo
    const primeraIncidencia = incidencias[0];
    const campoPosible = Object.keys(primeraIncidencia).find(key => 
      key.toLowerCase().includes('tipo') && 
      typeof primeraIncidencia[key] === 'number'
    );

    if (!campoPosible) {
      console.warn('⚠️ No se encontró el campo de tipo en las incidencias');
      setIncidenciasFiltradas([]);
      return;
    }

    const filtradas = incidencias.filter(inc => {
      const valorCampo = inc[campoPosible];
      return valorCampo === idTipo;
    });

    console.log(`🔍 Filtradas ${filtradas.length} incidencias para tipo ${idTipo}`);
    setIncidenciasFiltradas(filtradas);

    // ✅ LIMPIAR SELECCIÓN DE INCIDENCIA ESPECÍFICA SI NO PERTENECE AL NUEVO TIPO
    if (incidenciaSeleccionada) {
      const incidenciaActual = incidencias.find(inc => 
        inc.id_incidencia === parseInt(incidenciaSeleccionada)
      );
      
      if (incidenciaActual && incidenciaActual[campoPosible] !== idTipo) {
        console.log('🔄 Limpiando incidencia específica porque no coincide con el nuevo tipo');
        setValue('incidencia', '');
      }
    }
  };

  // ✅ MANEJAR CAMBIOS EN MEDIDAS INDIVIDUALES
  const handleMedidaChange = (idAlumno, campo, valor) => {
    setMedidasPorAlumno(prev => ({
      ...prev,
      [idAlumno]: {
        ...prev[idAlumno],
        [campo]: valor
      }
    }));
  };

  const onSubmit = (data) => {
    // ✅ VALIDAR QUE SI ES SUSPENSIÓN TENGA DÍAS
    const errores = [];
    
    Object.keys(medidasPorAlumno).forEach(alumnoId => {
      const medida = medidasPorAlumno[alumnoId];
      if (medida.tipo_medida === "2" && (!medida.cantidad_dias || medida.cantidad_dias < 1)) {
        const alumno = formData.alumnos.find(a => a.id_alumno == alumnoId);
        errores.push(`${alumno.nombre_alumno} ${alumno.apellido_alumno}: debe especificar días de suspensión`);
      }
    });
    
    if (errores.length > 0) {
      alert(`Errores de validación:\n${errores.join('\n')}`);
      return;
    }
    
    console.log('📤 Datos del formulario DetallesIncidencia:', data);
    console.log('📋 Medidas por alumno:', medidasPorAlumno);
    
    // ✅ COMBINAR DATOS GENERALES CON MEDIDAS INDIVIDUALES
    const alumnosConMedidas = formData.alumnos.map(alumno => {
      const medidaAlumno = medidasPorAlumno[alumno.id_alumno] || {};
      return {
        ...alumno,
        tipo_medida: medidaAlumno.tipo_medida,
        cantidad_dias: medidaAlumno.tipo_medida === "2" ? medidaAlumno.cantidad_dias : 0
      };
    });

    setFormData({
      ...formData,
      ...data,
      alumnos: alumnosConMedidas,
      medidasPorAlumno: medidasPorAlumno
    });
    
    navigate('/preceptor_rector/ResumenIncidencia');
  };

  const handleCancel = () => {
    if (window.confirm('¿Está seguro de que desea cancelar? Se perderán todos los datos ingresados.')) {
      resetFormData();
      navigate('/preceptor_rector');
    }
  };

  const handleBack = () => {
    // ✅ GUARDAR DATOS ACTUALES ANTES DE VOLVER
    setFormData({
      ...formData,
      tipo_incidencia: watch('tipo_incidencia'),
      incidencia: watch('incidencia'),
      id_lugar: watch('id_lugar'),
      descripcion_caso: watch('descripcion_caso'),
      medidasPorAlumno: medidasPorAlumno
    });
    
    navigate('/preceptor_rector/SeleccionAlumnos');
  };

  // ✅ MEJORADO: MANEJAR CAMBIO DE TIPO DE INCIDENCIA
  const handleTipoIncidenciaChange = (e) => {
    const nuevoTipo = e.target.value;
    
    if (nuevoTipo) {
      // ✅ LIMPIAR LA INCIDENCIA ESPECÍFICA AL CAMBIAR EL TIPO
      setValue('incidencia', '');
      filtrarIncidenciasPorTipo(nuevoTipo);
    } else {
      // ✅ MOSTRAR TODAS LAS INCIDENCIAS CUANDO SE LIMPIA EL TIPO
      setIncidenciasFiltradas(incidencias);
    }
  };

  // ✅ MANEJAR CAMBIO DIRECTO EN INCIDENCIA ESPECÍFICA
  const handleIncidenciaEspecificaChange = (e) => {
    const idIncidencia = e.target.value;
    setValue('incidencia', idIncidencia);
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
            <h2>Paso 2: Detalles de la Incidencia</h2>
            <button onClick={handleCancel} className='form-btn btn-secondary'>
              Cancelar Proceso
            </button>
          </div>

          {/* Resumen de alumnos seleccionados */}
          <div className="form-section">
            <h3>Alumnos Involucrados</h3>
            <div className="selected-students-summary">
              {formData?.alumnos?.map(alumno => {
                const medidaAlumno = medidasPorAlumno[alumno.id_alumno] || {};
                return (
                  <div key={alumno.id_alumno} className="student-badge">
                    <strong>{alumno.nombre_alumno} {alumno.apellido_alumno}</strong> - DNI: {alumno.dni_alumno}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formulario de detalles */}
          <div className="form-section">
            <h3>Información de la Incidencia</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="alumno-form">
              
              {/* ✅ SECCIÓN DE MEDIDAS - DIFERENTE SEGÚN CANTIDAD DE ALUMNOS */}
              {formData?.alumnos?.length === 1 ? (
                // ✅ UN SOLO ALUMNO - MEDIDA ÚNICA
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Tipo de Medida *</label>
                    <i>Llamado de Atención o Suspensión</i>
                    <select 
                      className="form-select"
                      value={medidasPorAlumno[formData.alumnos[0].id_alumno]?.tipo_medida || '1'}
                      onChange={(e) => handleMedidaChange(formData.alumnos[0].id_alumno, 'tipo_medida', e.target.value)}
                    >
                      <option value="1">Llamado de atención</option>
                      <option value="2">Suspensión</option>
                    </select>
                  </div>
                  
                  {/* DÍAS DE SUSPENSIÓN SI ES SUSPENSIÓN */}
                  {medidasPorAlumno[formData.alumnos[0].id_alumno]?.tipo_medida === "2" && (
                    <div className="form-group">
                      <label className="form-label">Días de Suspensión *</label>
                      <input
                        type="number"
                        className="form-input"
                        min="1"
                        max="30"
                        value={medidasPorAlumno[formData.alumnos[0].id_alumno]?.cantidad_dias || ''}
                        onChange={(e) => handleMedidaChange(formData.alumnos[0].id_alumno, 'cantidad_dias', e.target.value)}
                        placeholder="Ingrese días"
                      />
                    </div>
                  )}
                </div>
              ) : (
                // ✅ MÚLTIPLES ALUMNOS - MEDIDAS INDIVIDUALES
                  <div className="form-section">
                  <div className="form-label">Medidas Individuales por Alumno *</div>
                  <div className="table-responsive-wrapper">
                    <table className="results-table">
                      <thead>
                        <tr>
                          <th>Alumno</th>
                          <th>Tipo de Medida *</th>
                          <th>Días de Suspensión</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData?.alumnos?.map(alumno => (
                          <tr key={alumno.id_alumno}>
                            <td>
                              {alumno.nombre_alumno} {alumno.apellido_alumno}
                            </td>
                            <td>
                              <select
                                value={medidasPorAlumno[alumno.id_alumno]?.tipo_medida || '1'}
                                onChange={(e) => handleMedidaChange(alumno.id_alumno, 'tipo_medida', e.target.value)}
                                className="form-select"
                              >
                                <option value="1">Llamado de atención</option>
                                <option value="2">Suspensión</option>
                              </select>
                            </td>
                            <td>
                              {medidasPorAlumno[alumno.id_alumno]?.tipo_medida === '2' ? (
                                <input
                                  type="number"
                                  className="form-input"
                                  min="1"
                                  max="30"
                                  value={medidasPorAlumno[alumno.id_alumno]?.cantidad_dias || ''}
                                  onChange={(e) => handleMedidaChange(alumno.id_alumno, 'cantidad_dias', e.target.value)}
                                  placeholder="Días"
                                  style={{ width: '100px' }}
                                />
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PRIMERA FILA: Tipo de Incidencia */}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Tipo de Incidencia *</label>
                  <i>Área de la falta cometida</i>
                  <select 
                    className="form-select"
                    {...register('tipo_incidencia', { required: true })}
                    onChange={handleTipoIncidenciaChange}
                  >
                    <option value="">Seleccionar tipo de incidencia...</option>
                    {tiposIncidencias.map(tipo_incidencia => (
                      <option 
                        key={tipo_incidencia.id_tipo_incidencia} 
                        value={tipo_incidencia.id_tipo_incidencia}
                      >
                        {tipo_incidencia.tipo_incidencia_nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Incidencia Específica *</label>
                  <i>Falta específica cometida</i>
                  <select 
                    className="form-select"
                    {...register('incidencia', { required: true })}
                    onChange={handleIncidenciaEspecificaChange}
                  >
                    <option value="">Seleccionar incidencia específica...</option>
                    {incidenciasFiltradas.map(inc => (
                      <option key={inc.id_incidencia} value={inc.id_incidencia}>
                        {inc.nombre_incidencia}
                      </option>
                    ))}
                  </select>
                  {!tipoIncidenciaSeleccionado && (
                    <small className="form-text text-muted">
                      💡 Puede seleccionar primero la incidencia específica y el tipo se completará automáticamente
                    </small>
                  )}
                  {tipoIncidenciaSeleccionado && incidenciasFiltradas.length === 0 && (
                    <small className="form-text text-muted">
                      No hay incidencias específicas para este tipo
                    </small>
                  )}
                </div>
              </div>

              {/* SEGUNDA FILA: Lugar */}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Lugar *</label>
                  <select 
                    className="form-select"
                    {...register('id_lugar', { required: true })}
                  >
                    <option value="">Seleccionar lugar...</option>
                    {lugares.map(lugar => (
                      <option key={lugar.id_lugar} value={lugar.id_lugar}>
                        {lugar.nombre_lugar}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  {/* Espacio vacío para mantener el layout */}
                </div>
              </div>

              {/* Descripción del caso */}
              <div className="form-group full-width">
                <label className="form-label">Descripción del Caso</label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  placeholder="Describa los detalles específicos de la incidencia, contexto, participantes, etc..."
                  {...register('descripcion_caso', { required: false })}
                />
              </div>

              {/* Navegación */}
              <div className="navigation-buttons">
                <button 
                  type="button" 
                  className="form-btn btn-secondary"
                  onClick={handleBack}
                >
                  ← Volver a Alumnos
                </button>
                <button 
                  type="submit" 
                  className="form-btn btn-primary"
                >
                  Ver Resumen →
                </button>
              </div>
            </form>
          </div>

          <div className="info-panel">
            <h4>📋 Proceso de Registro de Incidencia:</h4>
            <p>1. <strong>Completado:</strong> Seleccionar alumnos involucrados</p>
            <p>2. <strong>Paso actual:</strong> Completar detalles de la incidencia</p>
            <p>3. <strong>Siguiente paso:</strong> Revisar y guardar incidencia</p>
            {formData?.alumnos?.length > 1 && (
              <p><strong>Nota:</strong> Puede asignar diferentes tipos de medida a cada alumno</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default DetallesIncidencia;