import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { useRegistration } from "../../contexts/RegistrationContext";
import { getAllGrados, getAllColegios, verificarDniAlumno } from '../../api/secretario.api';
import { dniValidationRules, dniInputProps } from '../validations/dniValidations';
import { nameValidationRules, nameInputProps, validateNameBase } from '../validations/nameValidations';
import { fechaNacimientoValidationRules, calcularEdad } from '../validations/dateValidations';
import BuscadorColegios from './BuscadorColegios';
import CrearColegioModal from './CrearColegioModal';
import Perfil from "../../components/Perfil";
import Button from "../../components/Buttons/Buttons";
import "../../style/RegistrarAlumno.css";

const RegistrarAlumno = () => {
  const { register, handleSubmit, formState: { errors }, setValue, trigger, watch } = useForm();
  const navigate = useNavigate();
  const { alumnoData, setAlumnoData, resetRegistration } = useRegistration();
  
  const [grados, setGrados] = useState([]);
  const [colegios, setColegios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);

  const fechaNacimiento = watch("fecha_nacimiento_alumno");
  const [edadCalculada, setEdadCalculada] = useState(null);

  useEffect(() => {
    if (fechaNacimiento) {
      const edad = calcularEdad(fechaNacimiento);
      setEdadCalculada(edad);
    } else {
      setEdadCalculada(null);
    }
  }, [fechaNacimiento]);

  // CARGA DE DATOS INICIALES
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadError(null);
        const [gradosRes, colegiosRes] = await Promise.all([
          getAllGrados(),
          getAllColegios()
        ]);
        
        if (gradosRes.data) setGrados(gradosRes.data);
        if (colegiosRes.data) setColegios(colegiosRes.data);
        
      } catch (error) {
        setLoadError('Error cargando datos: ' + error.message);
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);

  // Manejar cuando se crea un colegio desde el modal
  const handleColegioCreado = async (colegioCreado) => {
    try {
      setColegios(prev => [...prev, colegioCreado]);
      setValue('id_colegio', colegioCreado.id, { shouldValidate: true });
      await trigger('id_colegio');
      setMostrarModalCrear(false);
      console.log('✅ Colegio creado y seleccionado:', colegioCreado);
    } catch (error) {
      console.error('Error al seleccionar colegio creado:', error);
    }
  };

  // ENVÍO DEL FORMULARIO
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const respuestaDni = await verificarDniAlumno(data.dni_alumno);
      console.log("Respuesta verificación DNI:", respuestaDni.data);
      
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
      navigate("/RegistrarTutor");

    } catch (error) {
      console.error("Error en onSubmit:", error);
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // CANCELAR REGISTRO
  const handleCancel = () => {
    if (window.confirm('¿Cancelar registro? Se perderán los datos.')) {
      resetRegistration();
      navigate("/secretario");
    }
  };

  // RENDERIZADO
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
              Cancelar
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
                  {...register("dni_alumno", dniValidationRules)}
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
                </select>
                {errors.genero_alumno && <span className="error">{errors.genero_alumno.message}</span>}
              </div>

              <div className="form-group">
                <label>Grado *</label>
                <select 
                  {...register("id_grado", { required: "Grado requerido" })}
                  disabled={loading || grados.length === 0}
                >
                  <option value="">Seleccione Grado</option>
                  {grados.map(grado => (
                    <option key={grado.id_grado} value={grado.id_grado}>
                      {grado.nombre_grado} - {grado.asientos_disponibles} cupos
                    </option>
                  ))}
                </select>
                {errors.id_grado && <span className="error">{errors.id_grado.message}</span>}
                {grados.length === 0 && !loadError && (
                  <span className="info">Cargando grados...</span>
                )}
              </div>

              <div className="form-group">
                <div className="label-with-button">
                  <label>Colegio Procedencia *</label>
                  <button
                    type="button"
                    onClick={() => setMostrarModalCrear(true)}
                    className="btn-agregar-colegio"
                    title="Agregar nuevo colegio"
                    disabled={loading}
                  >
                    +
                  </button>
                </div>
                
                <BuscadorColegios
                  colegios={colegios}
                  onColegioSelect={(idColegio) => {
                    console.log('Colegio seleccionado ID:', idColegio);
                    setValue('id_colegio', idColegio, { 
                      shouldValidate: true 
                    });
                  }}
                  disabled={loading || colegios.length === 0}
                />
                
                <input
                  type="hidden"
                  {...register("id_colegio", { 
                    required: "Debe seleccionar un colegio de la lista",
                    validate: {
                      colegioExistente: (value) => {
                        if (!value) return "Colegio requerido";
                        const colegioExiste = colegios.some(
                          c => c.id === parseInt(value)
                        );
                        return colegioExiste || "El colegio seleccionado no es válido";
                      }
                    }
                  })}
                />
                
                {errors.id_colegio && (
                  <span className="error">{errors.id_colegio.message}</span>
                )}
                {colegios.length === 0 && !loadError && (
                  <span className="info">Cargando colegios...</span>
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
                disabled={loading}
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
        onClose={() => setMostrarModalCrear(false)}
        onColegioCreado={handleColegioCreado}
        colegiosExistentes={colegios}
      />
    </div>
  );
};

export default RegistrarAlumno;