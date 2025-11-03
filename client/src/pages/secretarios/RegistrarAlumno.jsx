import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { useRegistration } from "../../contexts/RegistrationContext";
import { getAllGrados, getAllColegios, verificarDniAlumno } from '../../api/secretario.api';
import { dniInputProps, dniValidationRulesCompletoAlumno } from '../validations/dniValidations';
import { nameValidationRules, nameInputProps, validateNameBase } from '../validations/nameValidations';
import { fechaNacimientoValidationRules, calcularEdad } from '../validations/dateValidations'; 
import BuscadorColegios from './BuscadorColegios';
import CrearColegioModal from './CrearColegioModal';
import Perfil from "../../components/Perfil";
import Button from "../../components/Buttons/Buttons";
import "../../style/RegistrarAlumno.css";

const RegistrarAlumno = () => {
  const { register, handleSubmit, formState: { errors, isValid }, setValue, trigger, watch } = useForm({
    mode: "onChange"
  });
  const { alumnoData, setAlumnoData, resetRegistration } = useRegistration();
  const navigate = useNavigate();
  
  const [grados, setGrados] = useState([]);
  const [colegios, setColegios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [colegioSeleccionado, setColegioSeleccionado] = useState(null);
  const [datosCargados, setDatosCargados] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fechaNacimiento = watch("fecha_nacimiento_alumno");
  const idColegio = watch("id_colegio");

  const [edadCalculada, setEdadCalculada] = useState(null);

  // Cargar datos guardados
  useEffect(() => {
    if (alumnoData && datosCargados) {
      if (alumnoData.id_colegio) {
        const colegio = colegios.find(c => c.id === alumnoData.id_colegio);
        if (colegio) {
          setColegioSeleccionado(colegio);
        }
      }

      const formData = {
        ...alumnoData,
        dni_alumno: alumnoData.dni_alumno?.toString() || '',
        id_grado: alumnoData.id_grado?.toString() || '',
        id_colegio: alumnoData.id_colegio?.toString() || ''
      };
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          setValue(key, formData[key]);
        }
      });
      
      trigger();
    }
  }, [alumnoData, datosCargados, colegios, setValue, trigger]);

  useEffect(() => {
    if (fechaNacimiento) {
      const edad = calcularEdad(fechaNacimiento);
      setEdadCalculada(edad);
    } else {
      setEdadCalculada(null);
    }
  }, [fechaNacimiento]);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadError(null);
        const [gradosRes, colegiosRes] = await Promise.all([
          getAllGrados(),
          getAllColegios()
        ]);
        
        if (gradosRes.data) setGrados(gradosRes.data);
        if (colegiosRes.data) {
          setColegios(colegiosRes.data);
        }
        
        setDatosCargados(true);
        
      } catch (error) {
        setLoadError('Error cargando datos: ' + error.message);
        setDatosCargados(true);
      }
    };
    
    loadData();
  }, []);

  const handleColegioCreado = async (colegioCreado) => {
    try {
      setColegios(prev => {
        const nuevaLista = [...prev, colegioCreado];
        return nuevaLista;
      });

      setRefreshKey(prev => {
        const nuevaKey = prev + 1;
        return nuevaKey;
      });

      setValue('id_colegio', colegioCreado.id, { 
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true 
      });
      
      setColegioSeleccionado(colegioCreado);

      await trigger('id_colegio');

      setMostrarModalCrear(false);

    } catch (error) {
      alert('Error al procesar el colegio creado');
    }
  };

  const handleColegioSelect = (idColegio) => {
    const colegio = colegios.find(c => c.id === idColegio);
    setColegioSeleccionado(colegio);
    setValue('id_colegio', idColegio, { 
      shouldValidate: true 
    });
    trigger('id_colegio');
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      if (!data.id_colegio) {
        alert('Debe seleccionar un colegio de procedencia');
        return;
      }

      const respuestaDni = await verificarDniAlumno(data.dni_alumno);
      
      if (respuestaDni.data.existe) {
        alert('Ya existe un alumno con este DNI');
        return;
      }

      const alumnoDataForContext = {
        ...data,
        dni_alumno: parseInt(data.dni_alumno, 10),
        id_grado: parseInt(data.id_grado, 10),
        id_colegio: parseInt(data.id_colegio, 10),
        estado_alumno: 'Activo'
      };

      setAlumnoData(alumnoDataForContext);

    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('¿Cancelar registro? Se perderán los datos.')) {
      resetRegistration();
      navigate("/secretario");
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <Perfil/>
      </header>
      
      <main className="page-main">
        <div className='alumno-form-container'>
          <div className="form-header">
            <h2>Paso 1: Datos del Alumno</h2>
          <Button
            variant="cancel"
            type="outline"
            size="square"
            onClick={handleCancel}
            className="close-button"
            title="Cancelar registro"
          >
            {/* Dejar completamente vacío */}
          </Button>
          </div>

          {loadError && (
            <div className="error-message">
              {loadError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="alumno-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  {...register("nombre_alumno", nameValidationRules)}
                  {...nameInputProps}
                  disabled={loading}
                />
                {errors.nombre_alumno && <span className="error">{errors.nombre_alumno.message}</span>}
              </div>

              <div className="form-group">
                <label>Apellido *</label>
                <input
                  {...register("apellido_alumno", {
                    required: "El apellido es requerido",
                    validate: (value) => validateNameBase(value, "apellido")
                  })}
                  {...nameInputProps}
                  placeholder="Ej: Pérez"
                  disabled={loading}
                />
                {errors.apellido_alumno && <span className="error">{errors.apellido_alumno.message}</span>}
              </div>

              <div className="form-group">
                <label>DNI *</label>
                <input
                  {...register("dni_alumno",  dniValidationRulesCompletoAlumno)}
                  {...dniInputProps}
                  disabled={loading}
                />
                {errors.dni_alumno && (
                  <span className="error">{errors.dni_alumno.message}</span>
                )}
              </div>

              <div className="form-group">
                <label>Fecha Nacimiento *</label>
                <input
                  type="date"
                  {...register("fecha_nacimiento_alumno", fechaNacimientoValidationRules)}
                  disabled={loading}
                />
                {fechaNacimiento && edadCalculada !== null && (
                  <div className="edad-info">
                    ({edadCalculada} años)
                  </div>
                )}
                {errors.fecha_nacimiento_alumno && (
                  <span className="error">{errors.fecha_nacimiento_alumno.message}</span>
                )}
              </div>

              <div className="form-group">
                <label>Género *</label>
                <select 
                  {...register("genero_alumno", { required: "Género requerido" })}
                  disabled={loading}
                >
                  <option value="">Seleccione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="O">Otro</option>
                </select>
                {errors.genero_alumno && <span className="error">{errors.genero_alumno.message}</span>}
              </div>

              <div className="form-group">
                <label>Grado *</label>
                <select 
                  {...register("id_grado", { required: "Grado requerido" })}
                  disabled={loading || !datosCargados}
                >
                  <option value="">{datosCargados ? "Seleccione Grado" : "Cargando grados..."}</option>
                  {grados.map(grado => (
                    <option key={grado.id_grado} value={grado.id_grado}>
                      {grado.nombre_grado} - {grado.asientos_disponibles} cupos
                    </option>
                  ))}
                </select>
                {errors.id_grado && <span className="error">{errors.id_grado.message}</span>}
              </div>

              <div className="form-group">
                <div className="label-with-button">
                  <label>Colegio Procedencia *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarModalCrear(true);
                    }}
                    className="btn-agregar-colegio"
                    title="Agregar nuevo colegio"
                    disabled={loading}
                  >
                    +
                  </button>
                </div>
                
                {!datosCargados ? (
                  <div className="loading-colegios">Cargando colegios...</div>
                ) : (
                  <>
                    <BuscadorColegios
                      key={`buscador-${refreshKey}`}
                      colegios={colegios}
                      onColegioSelect={handleColegioSelect}
                      disabled={loading || colegios.length === 0}
                      valorSeleccionado={colegioSeleccionado?.id}
                    />
                  </>
                )}
                
                <input
                  type="hidden"
                  {...register("id_colegio", { 
                    required: "Debe seleccionar un colegio de la lista",
                  })}
                />
                
                {errors.id_colegio && (
                  <span className="error">{errors.id_colegio.message}</span>
                )}
              </div>

              <div className="form-group full-width">
                <label>Observaciones</label>
                <textarea
                  {...register("observaciones_alumno")}
                  placeholder="Observaciones opcionales"
                  rows="3"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-actions">
              <Button
                variant="next"
                type="solid"
                size="large"
                onClick={handleSubmit(onSubmit)}
                disabled={loading || !isValid}
                className="submit-button"
              >
                {loading ? "Validando..." : "Siguiente Asignar Tutor"}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <CrearColegioModal
        isOpen={mostrarModalCrear}
        onClose={() => {
          setMostrarModalCrear(false);
        }}
        onColegioCreado={handleColegioCreado}
        colegiosExistentes={colegios}
      />
    </div>
  );
};

export default RegistrarAlumno;