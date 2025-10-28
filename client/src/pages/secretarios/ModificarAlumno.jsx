import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { 
    getAlumnoByDni, 
    updateAlumno, 
    updateAlumnoXGrado, 
    updateGradoAlumnoByDni, 
    getAllGrados, 
    getAllColegios, 
    getAlumnosXGradoByAlumnoDni,
    desactivarAlumnoByDni,
    activarAlumnoByDni
} from '../../api/secretario.api';
import { verificarTutorActivoByDni } from '../../api/secretario.api';
import "../../style/Tarjeta.css";
import Perfil from "../../components/Perfil";

// Componente para Alertas del Sistema (éxitos generales)
const Alert = ({ type, title, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <>
      <div className="alert-backdrop" onClick={onClose} />
      <div className={`alert alert-${type}`}>
        <button className="alert-close" onClick={onClose}>×</button>
        <div className="alert-content">
          <div className="alert-title">{title}</div>
          <div className="alert-message">{message}</div>
        </div>
      </div>
    </>
  );
};

const AlertContainer = ({ alerts, removeAlert }) => {
  if (!alerts.length) return null;

  return (
    <div className="alert-container">
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => removeAlert(alert.id)}
        />
      ))}
    </div>
  );
};

// Componente para mensajes de formulario
const FormErrorMessage = ({ error, verifying = false }) => {
  if (!error) return null;
  
  return (
    <div className="form-error">
      <span className="error-text">
        {error}
        {verifying && <span className="verifying-text"> (Verificando...)</span>}
      </span>
    </div>
  );
};

const FormSuccessMessage = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="form-success">
      <span className="success-text">{message}</span>
    </div>
  );
};

function ModificarAlumno() {
    const navigate = useNavigate();
    const params = useParams();
    const { register, handleSubmit, formState: { errors }, reset, setError: setFormError, clearErrors, watch } = useForm();
    
    const [loading, setLoading] = useState(true);
    const [error, setErrorState] = useState(''); // CAMBIADO: setError -> setErrorState
    const [alumnoData, setAlumnoData] = useState(null);
    const [grados, setGrados] = useState([]);
    const [colegios, setColegios] = useState([]);
    const [relacionGrado, setRelacionGrado] = useState(null);
    const [verificandoDuplicados, setVerificandoDuplicados] = useState(false);
    
    // Estado para alertas del sistema (solo éxitos)
    const [alerts, setAlerts] = useState([]);

    const dniAlumno = params.dni_alumno;
    const fechaNacimiento = watch("fecha_nacimiento_alumno");
    const dniAlumnoWatch = watch("dni_alumno");
    const nombreAlumnoWatch = watch("nombre_alumno");
    const apellidoAlumnoWatch = watch("apellido_alumno");
    const observacionesAlumnoWatch = watch("observaciones_alumno");

    // Funciones para alertas del sistema
    const showAlert = (type, title, message) => {
        const id = Date.now() + Math.random();
        const newAlert = { id, type, title, message };
        setAlerts(prev => [...prev, newAlert]);
    };

    const removeAlert = (id) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    };

    const showSuccess = (message, title = 'Éxito') => {
        showAlert('success', title, message);
    };

    // FUNCIÓN MEJORADA PARA FORMATEAR MENSAJES DE ERROR
    const formatearMensajeError = (mensaje, campo) => {
        if (!mensaje) return '';
        
        let mensajeStr = typeof mensaje === 'object' ? JSON.stringify(mensaje) : String(mensaje);
        
        // Traducciones específicas
        const traducciones = {
            'alumno with this dni alumno already exists.': 'Ya existe un alumno con este DNI',
            'alumno with this dni alumno already exists': 'Ya existe un alumno con este DNI',
            'dni alumno already exists': 'Ya existe un alumno con este DNI',
            'already exists': 'ya existe',
            'this field must be unique': 'este valor ya está en uso',
            'this field is required': 'Este campo es requerido',
            'cannot be blank': 'no puede estar vacío',
            'invalid': 'inválido',
        };
        
        // Aplicar traducciones
        let mensajeTraducido = mensajeStr.toLowerCase();
        for (const [key, value] of Object.entries(traducciones)) {
            if (mensajeTraducido.includes(key.toLowerCase())) {
                mensajeTraducido = mensajeTraducido.replace(key.toLowerCase(), value);
            }
        }
        
        // Limpiar formato JSON
        mensajeTraducido = mensajeTraducido
            .replace(/{|}|\[|\]|"|'/g, '')
            .replace(/dni del alumno:|dni_alumno:/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        // Capitalizar primera letra
        if (mensajeTraducido.length > 0) {
            mensajeTraducido = mensajeTraducido.charAt(0).toUpperCase() + mensajeTraducido.slice(1);
        }
        
        return mensajeTraducido;
    };

    // FUNCIÓN PARA VERIFICAR SI EL DNI PERTENECE A UN TUTOR
    const verificarDNIEnTutores = async (dni) => {
        try {
            const response = await verificarTutorActivoByDni(parseInt(dni, 10));
            
            if (response.existe && response.data) {
                return {
                    esTutor: true,
                    tutor: response.data,
                    mensaje: `Este DNI (${dni}) ya está registrado como TUTOR: ${response.data.nombre_tutor} ${response.data.apellido_tutor}`
                };
            }
            
            return { esTutor: false, tutor: null, mensaje: null };
            
        } catch (error) {
            console.error('Error verificando DNI en tutores:', error);
            return { 
                esTutor: false, 
                tutor: null, 
                mensaje: null,
                error: true 
            };
        }
    };

    // VERIFICACIÓN EN TIEMPO REAL DE DNI DUPLICADO CON TUTORES
    useEffect(() => {
        let isMounted = true;

        const verificarDuplicadosTiempoReal = async () => {
            if (!dniAlumnoWatch || dniAlumnoWatch === dniAlumno) {
                clearErrors("dni_alumno");
                return;
            }

            setVerificandoDuplicados(true);

            if (dniAlumnoWatch && dniAlumnoWatch.length === 8) {
                try {
                    const resultado = await verificarDNIEnTutores(dniAlumnoWatch);
                    
                    if (!isMounted) return;

                    if (resultado.esTutor) {
                        setFormError("dni_alumno", {
                            type: "manual",
                            message: resultado.mensaje
                        });
                    } else {
                        clearErrors("dni_alumno");
                    }
                } catch (error) {
                    if (!isMounted) return;
                    console.error('Error en verificación tiempo real:', error);
                    clearErrors("dni_alumno");
                }
            } else {
                clearErrors("dni_alumno");
            }

            setVerificandoDuplicados(false);
        };

        const timeoutId = setTimeout(verificarDuplicadosTiempoReal, 800);
        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [dniAlumnoWatch, dniAlumno, setFormError, clearErrors]);

    // FUNCIÓN PARA FORMATEAR FECHA
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

    // FUNCIÓN PARA MOSTRAR GRADO
    const mostrarGrado = () => {
        if (relacionGrado && relacionGrado.grado_info) {
            return relacionGrado.grado_info.nombre_grado;
        }
        
        if (relacionGrado && relacionGrado.id_grado) {
            const grado = grados.find(g => g.id_grado === relacionGrado.id_grado);
            return grado ? grado.nombre_grado : 'No asignado';
        }
        
        return 'No asignado';
    };

    // FUNCIONES PARA LIMITAR CARACTERES
    const limitarCaracteres = (e, maxLength) => {
        if (e.target.value.length > maxLength) {
            e.target.value = e.target.value.slice(0, maxLength);
        }
    };

    const limpiarEspacios = (e) => {
        e.target.value = e.target.value.replace(/\s{2,}/g, ' ');
    };

    const limitarDNI = (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
        
        if (e.target.value.length > 8) {
            e.target.value = e.target.value.slice(0, 8);
        }
        
        clearErrors("dni_alumno");
    };

    const mostrarEstadoDNI = () => {
        const dni = dniAlumnoWatch;
        
        if (!dni && dni !== 0) return null;
        
        const dniString = String(dni);
        const longitud = dniString.length;
        
        let clase = "char-counter";
        let mensaje = `${longitud}/8 dígitos`;
        
        if (longitud < 8) {
            clase += " warning";
            mensaje += " (requeridos 8)";
        } else if (longitud === 8) {
            clase += " success";
            mensaje += " ";
        }
        
        return <div className={clase}>{mensaje}</div>;
    };

    useEffect(() => {
        async function loadAlumno() {
            try {
                setLoading(true);
                console.log('Cargando datos del alumno...');
                
                const [alumnoResponse, gradosResponse, colegiosResponse, relacionResponse] = await Promise.all([
                    getAlumnoByDni(dniAlumno),
                    getAllGrados(),
                    getAllColegios(),
                    getAlumnosXGradoByAlumnoDni(dniAlumno)
                ]);
                
                setAlumnoData(alumnoResponse.data);
                setGrados(gradosResponse.data);
                setColegios(colegiosResponse.data);
                
                if (relacionResponse.data && relacionResponse.data.length > 0) {
                    setRelacionGrado(relacionResponse.data[0]);
                }

                const relacionActual = relacionResponse.data && relacionResponse.data[0];
                reset({
                    dni_alumno: alumnoResponse.data.dni_alumno,
                    nombre_alumno: alumnoResponse.data.nombre_alumno,
                    apellido_alumno: alumnoResponse.data.apellido_alumno,
                    fecha_nacimiento_alumno: alumnoResponse.data.fecha_nacimiento_alumno,
                    genero_alumno: alumnoResponse.data.genero_alumno,
                    observaciones_alumno: alumnoResponse.data.observaciones_alumno || "",
                    id_grado: relacionActual?.id_grado || "",
                    nro_colegio_procedencia: relacionActual?.nro_colegio_procedencia || ""
                });

            } catch (error) {
                console.error('Error cargando alumno:', error);
                setErrorState('Error al cargar los datos del alumno: ' + (error.response?.data?.message || error.message)); // CAMBIADO
            } finally {
                setLoading(false);
            }
        }

        if (dniAlumno) {
            loadAlumno();
        } else {
            setErrorState('No se proporcionó DNI del alumno'); // CAMBIADO
            setLoading(false);
        }
    }, [dniAlumno, reset]);

    // VALIDACIONES
    const validarFormatoFecha = (fecha) => {
        if (!fecha) return "La fecha de nacimiento es requerida";
        
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(fecha)) {
            return "Formato de fecha inválido. Use YYYY-MM-DD";
        }
        
        const [año, mes, dia] = fecha.split('-').map(Number);
        
        if (mes < 1 || mes > 12) return "Mes inválido";
        if (dia < 1 || dia > 31) return "Día inválido";
        
        const fechaObj = new Date(año, mes - 1, dia);
        if (fechaObj.getFullYear() !== año || 
            fechaObj.getMonth() !== mes - 1 || 
            fechaObj.getDate() !== dia) {
            return "Fecha de nacimiento inválida";
        }
        
        return true;
    };

    const calcularEdadExacta = (fechaNacimiento) => {
        const validacionFormato = validarFormatoFecha(fechaNacimiento);
        if (validacionFormato !== true) {
            return { edad: 0, error: validacionFormato };
        }
        
        const hoy = new Date();
        const [añoNac, mesNac, diaNac] = fechaNacimiento.split('-').map(Number);
        const nacimiento = new Date(añoNac, mesNac - 1, diaNac);
        
        if (nacimiento > hoy) {
            return { edad: 0, error: "La fecha de nacimiento no puede ser futura" };
        }
        
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        
        const mesActual = hoy.getMonth();
        const mesNacimiento = nacimiento.getMonth();
        const diaActual = hoy.getDate();
        const diaNacimiento = nacimiento.getDate();
        
        if (mesActual < mesNacimiento || 
            (mesActual === mesNacimiento && diaActual < diaNacimiento)) {
            edad--;
        }
        
        return { edad, error: null };
    };

    const validarEdadEscolar = (fecha) => {
        if (!fecha) {
            return "La fecha de nacimiento es requerida";
        }
        
        const { edad, error } = calcularEdadExacta(fecha);
        
        if (error) {
            return error;
        }
        
        if (edad < 12) {
            return `El alumno tiene ${edad} años. La edad mínima es 12 años.`;
        }
        
        if (edad > 19) {
            return `El alumno tiene ${edad} años. La edad máxima es 19 años.`;
        }
        
        return true;
    };

    const validarDNI = (dni) => {
        if (!dni) return "El DNI es requerido";
        
        const stringDni = String(dni);
        const regex = /^[1-9]\d{7}$/;
        if (!regex.test(stringDni)) {
            return "El DNI debe tener exactamente 8 dígitos y no puede comenzar con 0";
        }
        
        const dniNum = parseInt(stringDni, 10);
        if (dniNum < 1000000) {
            return "El DNI parece inválido";
        }
        if (dniNum > 99999999) {
            return "El DNI parece inválido";
        }
        
        return true;
    };

    const validarNombre = (nombre, campo) => {
        if (!nombre) return `El ${campo} es requerido`;
        
        const stringNombre = String(nombre);
        const nombreTrimmed = stringNombre.trim();
        
        if (nombreTrimmed.length === 0) {
            return `El ${campo} no puede estar vacío o contener solo espacios`;
        }
        
        if (nombreTrimmed.length < 2) {
            return `Mínimo 2 caracteres para ${campo}`;
        }
        
        if (nombreTrimmed.length > 35) {
            return `Máximo 35 caracteres permitidos para ${campo}`;
        }
        
        const tieneLetras = /[A-Za-zÁáÉéÍíÓóÚúÑñ]/.test(nombreTrimmed);
        if (!tieneLetras) {
            return `El ${campo} debe contener al menos una letra`;
        }
        
        const regex = /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/;
        if (!regex.test(nombreTrimmed)) {
            return `Solo se permiten letras y espacios en ${campo}`;
        }
        
        const tieneMultiplesEspacios = /\s{2,}/.test(nombreTrimmed);
        if (tieneMultiplesEspacios) {
            return `El ${campo} no puede tener múltiples espacios consecutivos`;
        }
        
        return true;
    };

    const mostrarEdadActual = () => {
        if (!fechaNacimiento) return null;
        
        const { edad, error } = calcularEdadExacta(fechaNacimiento);
        
        if (error) {
            return <span className="edad-info error"> {error}</span>;
        }
        
        let claseEdad = "edad-info";
        
        if (edad < 12) {
            claseEdad += " error";
        } else if (edad > 19) {
            claseEdad += " error";
        } else {
            claseEdad += " success";
        }
        
        return <span className={claseEdad}>Edad actual: {edad} años</span>;
    };

    const validarGradoConCupos = (idGrado) => {
        if (!idGrado) return "Seleccione un grado";
        
        const gradoSeleccionado = grados.find(g => g.id_grado === parseInt(idGrado));
        if (!gradoSeleccionado) {
            return "Grado seleccionado no válido";
        }
        
        const gradoActualId = relacionGrado?.id_grado;
        
        if (parseInt(idGrado) === gradoActualId) {
            return true;
        }
        
        if (gradoSeleccionado.asientos_disponibles <= 0) {
            return "El grado seleccionado no tiene cupos disponibles";
        }
        
        return true;
    };

    const validarDNIUnico = async (dni) => {
        if (!dni || dni === dniAlumno) return true;
        
        try {
            const verificacionTutor = await verificarDNIEnTutores(dni);
            if (verificacionTutor.esTutor) {
                return verificacionTutor.mensaje;
            }
            
            return true;
        } catch (error) {
            console.error('Error validando DNI único:', error);
            return "Error validando el DNI";
        }
    };

    // FUNCIÓN PARA CAMBIAR ESTADO DEL ALUMNO
    const handleToggleEstado = async () => {
        if (!alumnoData) return;
        
        const nuevoEstado = alumnoData.estado_alumno === 'Activo' ? 'Inactivo' : 'Activo';
        const accion = nuevoEstado === 'Inactivo' ? 'desactivar' : 'activar';
        const gradoActual = mostrarGrado();
        
        const mensaje = nuevoEstado === 'Inactivo' 
            ? `¿Está seguro de que desea DESACTIVAR al alumno?\n\nEsto liberará un asiento en el grado ${gradoActual}.`
            : `¿Está seguro de que desea ACTIVAR al alumno?\n\nEsto ocupará un asiento en el grado ${gradoActual}.`;

        if (window.confirm(mensaje)) {
            try {
                setLoading(true);
                
                let response;
                if (nuevoEstado === 'Inactivo') {
                    response = await desactivarAlumnoByDni(alumnoData.dni_alumno);
                } else {
                    response = await activarAlumnoByDni(alumnoData.dni_alumno);
                }
                
                let mensajeExito = `Alumno ${accion === 'desactivar' ? 'desactivado' : 'activado'} correctamente`;
                if (response.data.asiento_liberado || response.data.asiento_ocupado) {
                    mensajeExito += `\nGrado ${gradoActual} actualizado`;
                }
                
                showSuccess(mensajeExito, 'Alumno desactivado');
                
                const alumnoResponse = await getAlumnoByDni(dniAlumno);
                setAlumnoData(alumnoResponse.data);
                
            } catch (error) {
                console.error(`Error al ${accion} alumno:`, error);
                // Manejar error como mensaje de formulario
                let mensajeError = `Error al ${accion} alumno`;
                
                if (error.response?.data?.error) {
                    mensajeError = error.response.data.error;
                }
                
                setFormError("root", {
                    type: "server",
                    message: mensajeError
                });
            } finally {
                setLoading(false);
            }
        }
    };

    // ONSUBMIT MEJORADO - ERRORES COMO FORMULARIO
    const onSubmit = async (data) => {
        try {
            setLoading(true);
            // Limpiar errores previos
            clearErrors();
            
            console.log('Datos a actualizar:', data);

            // Validaciones básicas
            const nombreTrimmed = data.nombre_alumno.trim();
            const apellidoTrimmed = data.apellido_alumno.trim();
            
            if (nombreTrimmed.length === 0) {
                setFormError("nombre_alumno", {
                    type: "manual",
                    message: "El nombre no puede estar vacío o contener solo espacios"
                });
                return;
            }
            
            if (apellidoTrimmed.length === 0) {
                setFormError("apellido_alumno", {
                    type: "manual", 
                    message: "El apellido no puede estar vacío o contener solo espacios"
                });
                return;
            }

            const dniString = String(data.dni_alumno || '');
            
            if (dniString.length !== 8) {
                setFormError("dni_alumno", {
                    type: "manual",
                    message: "El DNI debe tener exactamente 8 dígitos"
                });
                return;
            }

            // Verificación final DNI vs tutores
            if (data.dni_alumno !== dniAlumno) {
                const verificacionFinal = await verificarDNIEnTutores(data.dni_alumno);
                if (verificacionFinal.esTutor) {
                    setFormError("dni_alumno", {
                        type: "manual",
                        message: verificacionFinal.mensaje
                    });
                    return;
                }
            }

            const alumnoActualizado = {
                dni_alumno: parseInt(data.dni_alumno, 10),
                nombre_alumno: nombreTrimmed,
                apellido_alumno: apellidoTrimmed,
                fecha_nacimiento_alumno: data.fecha_nacimiento_alumno,
                genero_alumno: data.genero_alumno,
                observaciones_alumno: data.observaciones_alumno?.trim() || "",
                estado_alumno: alumnoData.estado_alumno
            };

            console.log('Enviando actualización alumno:', alumnoActualizado);
            
            let alumnoResponse;
            try {
                alumnoResponse = await updateAlumno(alumnoData.id_alumno, alumnoActualizado);
                console.log('Alumno actualizado:', alumnoResponse.data);
            } catch (alumnoError) {
                console.error('Error actualizando alumno:', alumnoError);
                
                // MANEJAR ERRORES DEL SERVIDOR COMO ERRORES DE FORMULARIO
                if (alumnoError.response?.data) {
                    const errores = alumnoError.response.data;
                    
                    if (typeof errores === 'object') {
                        for (const campo in errores) {
                            if (Array.isArray(errores[campo])) {
                                const mensajeFormateado = formatearMensajeError(errores[campo][0], campo);
                                setFormError(campo, {
                                    type: "server",
                                    message: mensajeFormateado
                                });
                            } else if (typeof errores[campo] === 'string') {
                                const mensajeFormateado = formatearMensajeError(errores[campo], campo);
                                setFormError(campo, {
                                    type: "server", 
                                    message: mensajeFormateado
                                });
                            }
                        }
                    } else if (typeof errores === 'string') {
                        const mensajeFormateado = formatearMensajeError(errores);
                        setFormError("root", {
                            type: "server",
                            message: mensajeFormateado
                        });
                    }
                } else if (alumnoError.message) {
                    setFormError("root", {
                        type: "server",
                        message: formatearMensajeError(alumnoError.message)
                    });
                }
                
                throw alumnoError;
            }

            // Actualizar relación con grado
            const gradoActual = relacionGrado?.id_grado;
            const gradoNuevo = parseInt(data.id_grado, 10);

            if (gradoActual !== gradoNuevo) {
                try {
                    const cambioGradoData = { id_grado: gradoNuevo };
                    await updateGradoAlumnoByDni(dniAlumno, cambioGradoData);
                } catch (gradoError) {
                    console.error('Error cambiando grado:', gradoError);
                    // Manejar error de grado como mensaje de formulario
                    let mensajeErrorGrado = 'Error al cambiar el grado del alumno';
                    
                    if (gradoError.response?.data?.error) {
                        mensajeErrorGrado = formatearMensajeError(gradoError.response.data.error);
                    }
                    
                    setFormError("id_grado", {
                        type: "server",
                        message: mensajeErrorGrado
                    });
                    throw gradoError;
                }
            } else {
                // Actualizar solo colegio de procedencia
                const relacionGradoData = {
                    id_alumno: alumnoData.id_alumno,
                    id_grado: gradoNuevo,
                    nro_colegio_procedencia: parseInt(data.nro_colegio_procedencia, 10)
                };

                try {
                    if (relacionGrado && relacionGrado.id_alumno_x_grado) {
                        await updateAlumnoXGrado(relacionGrado.id_alumno_x_grado, relacionGradoData);
                    }
                } catch (gradoError) {
                    console.error('Error actualizando colegio de procedencia:', gradoError);
                    // No lanzar error para no interrumpir el flujo de éxito
                }
            }

            // MOSTRAR ALERTA DE ÉXITO
            showSuccess('¡Alumno actualizado exitosamente!', 'Alumno actualizado');
            
            setTimeout(() => {
                navigate("/ListaAlumnos");
            }, 1500);

        } catch (error) {
            console.error('Error actualizando alumno:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <header className="page-header">
                    <Perfil />
                </header>
                <main className="page-main">
                    <div className="container">
                        <div className="loading">Cargando datos del alumno...</div>
                        <button onClick={() => navigate("/ListaAlumnos")} className="btn btn-secondary">Cancelar</button>
                    </div>
                </main>
            </div>
        );
    }

    if (error) { // CAMBIADO: error -> error (aunque el estado es setErrorState, la variable se llama error)
        return (
            <div className="page-container">
                <header className="page-header">
                    <Perfil />
                </header>
                <main className="page-main">
                    <div className="container">
                        <div className="error-message">{error}</div>
                        <button onClick={() => navigate("/ListaAlumnos")} className="btn btn-secondary">Volver a la lista</button>
                    </div>
                </main>
            </div>
        );
    }

    if (!alumnoData) {
        return (
            <div className="page-container">
                <header className="page-header">
                    <Perfil />
                </header>
                <main className="page-main">
                    <div className="container">
                        <div className="error-message">No se encontró el alumno</div>
                        <button onClick={() => navigate("/ListaAlumnos")} className="btn btn-secondary">Volver a la lista</button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Container de Alertas (solo para éxitos) */}
            <AlertContainer alerts={alerts} removeAlert={removeAlert} />
            
            <header className="page-header">
                <Perfil />
            </header>
            
            <main className="page-main">
                <div className="container">
                    <div className="header">
                        <button onClick={() => navigate("/ListaAlumnos")} className="btn btn-secondary">
                            ← Volver a la lista
                        </button>
                        <h1>Modificar Alumno</h1>
                    </div>

                    {/* Información actual del alumno */}
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <div className="card-header">
                            <h3>Información Actual del Alumno</h3>
                        </div>
                        <div className="card-body">
                            <div className="info-row">
                                <span className="label">Nombre:</span>
                                <span className="value">{alumnoData.nombre_alumno} {alumnoData.apellido_alumno}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">DNI:</span>
                                <span className="value">{alumnoData.dni_alumno}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Fecha Nacimiento:</span>
                                <span className="value">{formatearFechaLocal(alumnoData.fecha_nacimiento_alumno)}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Género:</span>
                                <span className="value">{alumnoData.genero_alumno === 'M' ? 'Masculino' : 'Femenino'}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Grado:</span>
                                <span className="value">{mostrarGrado()}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Estado:</span>
                                <span className={`badge ${alumnoData.estado_alumno === 'Activo' ? 'badge-success' : 'badge-danger'}`}>
                                    {alumnoData.estado_alumno === 'Activo' ? 'Activo' : 'Inactivo'}  
                                </span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="form-container">
                        <div className="form-section">
                            <h3>Datos a Modificar</h3>
                            
                            {/* Error general del servidor */}
                            {errors.root && (
                                <div className="form-error server-error">
                                    {errors.root.message}
                                </div>
                            )}
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>DNI *</label>
                                    <input
                                        type="text"
                                        {...register("dni_alumno", { 
                                            required: "El DNI es requerido",
                                            validate: {
                                                dniValido: (value) => validarDNI(value),
                                            }
                                        })}
                                        className={`form-input ${errors.dni_alumno ? 'input-error' : ''} ${dniAlumnoWatch?.length === 8 && !errors.dni_alumno ? 'input-success' : ''}`}
                                        placeholder="8 dígitos exactos (sin puntos)"
                                        maxLength={8}
                                        onInput={limitarDNI}
                                    />
                                    {mostrarEstadoDNI()}
                                    <FormErrorMessage 
                                        error={errors.dni_alumno?.message} 
                                        verifying={verificandoDuplicados}
                                    />
                                    {dniAlumnoWatch?.length === 8 && !errors.dni_alumno && (
                                        <FormSuccessMessage message="DNI válido" />
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Nombre *</label>
                                    <input
                                        type="text"
                                        {...register("nombre_alumno", { 
                                            required: "El nombre es requerido",
                                            validate: {
                                                nombreValido: (value) => validarNombre(value, "nombre")
                                            }
                                        })}
                                        className={`form-input ${errors.nombre_alumno ? 'input-error' : ''} ${nombreAlumnoWatch?.trim() && !errors.nombre_alumno ? 'input-success' : ''}`}
                                        maxLength={35}
                                        onInput={(e) => {
                                            limitarCaracteres(e, 35);
                                            limpiarEspacios(e);
                                        }}
                                        onBlur={(e) => {
                                            e.target.value = e.target.value.trim();
                                        }}
                                    />
                                    <div className="char-counter">
                                        {nombreAlumnoWatch ? nombreAlumnoWatch.trim().length : 0}/35 caracteres
                                    </div>
                                    <FormErrorMessage error={errors.nombre_alumno?.message} />
                                    {nombreAlumnoWatch?.trim() && !errors.nombre_alumno && (
                                        <FormSuccessMessage message="Nombre válido" />
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Apellido *</label>
                                    <input
                                        type="text"
                                        {...register("apellido_alumno", { 
                                            required: "El apellido es requerido",
                                            validate: {
                                                apellidoValido: (value) => validarNombre(value, "apellido")
                                            }
                                        })}
                                        className={`form-input ${errors.apellido_alumno ? 'input-error' : ''} ${apellidoAlumnoWatch?.trim() && !errors.apellido_alumno ? 'input-success' : ''}`}
                                        maxLength={35}
                                        onInput={(e) => {
                                            limitarCaracteres(e, 35);
                                            limpiarEspacios(e);
                                        }}
                                        onBlur={(e) => {
                                            e.target.value = e.target.value.trim();
                                        }}
                                    />
                                    <div className="char-counter">
                                        {apellidoAlumnoWatch ? apellidoAlumnoWatch.trim().length : 0}/35 caracteres
                                    </div>
                                    <FormErrorMessage error={errors.apellido_alumno?.message} />
                                    {apellidoAlumnoWatch?.trim() && !errors.apellido_alumno && (
                                        <FormSuccessMessage message="Apellido válido" />
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Fecha de Nacimiento *</label>
                                    <input
                                        type="date"
                                        {...register("fecha_nacimiento_alumno", { 
                                            required: "La fecha de nacimiento es obligatoria",
                                            validate: {
                                                edadValida: (value) => validarEdadEscolar(value)
                                            }
                                        })}
                                        className={`form-input ${errors.fecha_nacimiento_alumno ? 'input-error' : ''} ${fechaNacimiento && !errors.fecha_nacimiento_alumno ? 'input-success' : ''}`}
                                        max={new Date().toISOString().split('T')[0]}
                                        min="1900-01-01"
                                    />
                                    <div className="edad-display">
                                        {mostrarEdadActual()}
                                    </div>
                                    <FormErrorMessage error={errors.fecha_nacimiento_alumno?.message} />
                                    {fechaNacimiento && !errors.fecha_nacimiento_alumno && (
                                        <FormSuccessMessage message="Fecha válida" />
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Género *</label>
                                    <select
                                        {...register("genero_alumno", { 
                                            required: "El género es obligatorio" 
                                        })}
                                        className={`form-select ${errors.genero_alumno ? 'input-error' : ''} ${watch("genero_alumno") && !errors.genero_alumno ? 'input-success' : ''}`}
                                    >
                                        <option value="">-- Seleccione --</option>
                                        <option value="M">Masculino</option>
                                        <option value="F">Femenino</option>
                                    </select>
                                    <FormErrorMessage error={errors.genero_alumno?.message} />
                                    {watch("genero_alumno") && !errors.genero_alumno && (
                                        <FormSuccessMessage message="Género seleccionado" />
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Grado *</label>
                                    <select
                                        {...register("id_grado", { 
                                            required: "Seleccione un grado",
                                            validate: {
                                                cuposDisponibles: (value) => validarGradoConCupos(value)
                                            }
                                        })}
                                        className={`form-select ${errors.id_grado ? 'input-error' : ''} ${watch("id_grado") && !errors.id_grado ? 'input-success' : ''}`}
                                    >
                                        <option value="">-- Seleccione Grado --</option>
                                        {Array.isArray(grados) && grados.map((grado) => {
                                            const esGradoActual = relacionGrado?.id_grado === grado.id_grado;
                                            const tieneCupos = grado.asientos_disponibles > 0;
                                            const estaDeshabilitado = !esGradoActual && !tieneCupos;
                                            
                                            return (
                                                <option 
                                                    key={`grado-${grado.id_grado}`} 
                                                    value={grado.id_grado}
                                                    disabled={estaDeshabilitado}
                                                >
                                                    {grado.nombre_grado} - {grado.asientos_disponibles} asientos disponibles
                                                    {esGradoActual && ' (ACTUAL)'}
                                                    {estaDeshabilitado && ' (SIN CUPOS)'}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <FormErrorMessage error={errors.id_grado?.message} />
                                    {watch("id_grado") && !errors.id_grado && (
                                        <FormSuccessMessage message="Grado seleccionado" />
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Colegio de Procedencia *</label>
                                    <select
                                        {...register("nro_colegio_procedencia", { 
                                            required: "Seleccione un colegio" 
                                        })}
                                        className={`form-select ${errors.nro_colegio_procedencia ? 'input-error' : ''} ${watch("nro_colegio_procedencia") && !errors.nro_colegio_procedencia ? 'input-success' : ''}`}
                                    >
                                        <option value="">-- Seleccione Colegio --</option>
                                        {Array.isArray(colegios) && colegios.map((colegio) => (
                                            <option 
                                                key={`colegio-${colegio.nro_colegio_procedencia}`} 
                                                value={colegio.nro_colegio_procedencia}
                                            >
                                                {colegio.nombre_colegio_procedencia}
                                            </option>
                                        ))}
                                    </select>
                                    <FormErrorMessage error={errors.nro_colegio_procedencia?.message} />
                                    {watch("nro_colegio_procedencia") && !errors.nro_colegio_procedencia && (
                                        <FormSuccessMessage message="Colegio seleccionado" />
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Observaciones</label>
                                    <textarea
                                        rows="3"
                                        className={`form-textarea ${errors.observaciones_alumno ? 'input-error' : ''} ${observacionesAlumnoWatch?.trim() && !errors.observaciones_alumno ? 'input-success' : ''}`}
                                        {...register("observaciones_alumno", {
                                            maxLength: {
                                                value: 250,
                                                message: "Máximo 250 caracteres permitidos"
                                            }
                                        })}
                                        placeholder="Observaciones opcionales sobre salud, conducta, necesidades especiales, etc."
                                        maxLength={250}
                                        onInput={(e) => limitarCaracteres(e, 250)}
                                        onBlur={(e) => {
                                            e.target.value = e.target.value.trim();
                                        }}
                                    />
                                    <div className="char-counter">
                                        {observacionesAlumnoWatch ? observacionesAlumnoWatch.trim().length : 0}/250 caracteres
                                    </div>
                                    <FormErrorMessage error={errors.observaciones_alumno?.message} />
                                    {observacionesAlumnoWatch?.trim() && !errors.observaciones_alumno && (
                                        <FormSuccessMessage message="Observaciones válidas" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button 
                                type="button" 
                                onClick={() => navigate("/ListaAlumnos")}
                                className="btn btn-secondary"
                            >
                                Volver a Lista
                            </button>
                            
                            {alumnoData && (
                                <button 
                                    type="button"
                                    onClick={handleToggleEstado}
                                    className={`btn ${alumnoData.estado_alumno === 'Activo' ? 'btn-danger' : 'btn-success'}`}
                                    disabled={loading}
                                >
                                    {loading ? 'Procesando...' : 
                                     alumnoData.estado_alumno === 'Activo' ? 'Desactivar Alumno' : 'Activar Alumno'}
                                </button>
                            )}
                            
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={loading || verificandoDuplicados}
                            >
                                {loading ? 'Guardando...' : 
                                 verificandoDuplicados ? 'Verificando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>  
    );
}

export default ModificarAlumno;