import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { getTutorById, updateTutor, verificarTutorActivoByDni, getAlumnoByDni, verificarTelefonoTutor } from '../../api/secretario.api';
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

function ModificarTutor() {
    const navigate = useNavigate();
    const params = useParams();
    const { register, handleSubmit, formState: { errors }, reset, setError: setFormError, clearErrors, watch } = useForm();
    
    const [loading, setLoading] = useState(true);
    const [error, setErrorState] = useState('');
    const [tutorData, setTutorData] = useState(null);
    const [verificandoDuplicados, setVerificandoDuplicados] = useState(false);
    const [alerts, setAlerts] = useState([]);

    const idTutor = params.id_tutor;
    const dniTutorWatch = watch("dni_tutor");
    const nombreTutorWatch = watch("nombre_tutor");
    const apellidoTutorWatch = watch("apellido_tutor");
    const telefonoTutorWatch = watch("telefono_tutor");
    const correoTutorWatch = watch("correo_tutor");

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

    // FUNCIÓN PARA VERIFICAR SI EL DNI PERTENECE A UN ALUMNO
    const verificarDNIEnAlumnos = async (dni) => {
        try {
            console.log(`🔍 [verificarDNIEnAlumnos] Verificando si DNI ${dni} pertenece a un alumno`);
            
            const response = await getAlumnoByDni(parseInt(dni, 10));
            
            // Tu API devuelve { data: null } cuando no encuentra el alumno
            if (response.data === null) {
                console.log(`✅ [verificarDNIEnAlumnos] DNI ${dni} NO está registrado como alumno`);
                return { 
                    esAlumno: false, 
                    alumno: null, 
                    mensaje: null 
                };
            }
            
            // Si response.data tiene información, significa que encontró un alumno
            if (response.data && response.data.dni_alumno) {
                console.log(`❌ [verificarDNIEnAlumnos] DNI ${dni} está registrado como ALUMNO:`, response.data);
                return {
                    esAlumno: true,
                    alumno: response.data,
                    mensaje: `Este DNI (${dni}) ya está registrado como ALUMNO: ${response.data.nombre_alumno} ${response.data.apellido_alumno}`
                };
            }
            
            // Caso por defecto (no debería ocurrir con tu API actual)
            return { esAlumno: false, alumno: null, mensaje: null };
            
        } catch (error) {
            console.error('❌ [verificarDNIEnAlumnos] Error verificando DNI en alumnos:', error);
            
            // En caso de error, asumimos que no es alumno para no bloquear el flujo
            return { 
                esAlumno: false, 
                alumno: null, 
                mensaje: null,
                error: true 
            };
        }
    };

    // FUNCIÓN DE VERIFICACIÓN DE TELÉFONO ÚNICO
    const verificarTelefonoUnico = async (telefono) => {
        if (!telefono || telefono === tutorData?.telefono_tutor) return true;
        
        try {
            console.log(`🔍 [verificarTelefonoUnico] Verificando teléfono: ${telefono}`);
            
            const response = await verificarTelefonoTutor(telefono);
            
            if (response.data.existe) {
                // Si el teléfono pertenece a OTRO tutor (no al actual)
                if (response.data.data && response.data.data.id_tutor !== parseInt(idTutor)) {
                    console.log(`❌ [verificarTelefonoUnico] Teléfono ${telefono} pertenece a otro tutor - BLOQUEANDO`);
                    
                    if (response.data.activo) {
                        return `El teléfono ya está siendo utilizado por el tutor: ${response.data.data.nombre_tutor} ${response.data.data.apellido_tutor}`;
                    } else {
                        return `El teléfono pertenece a un tutor inactivo: ${response.data.data.nombre_tutor} ${response.data.data.apellido_tutor}. No puede usar este teléfono.`;
                    }
                }
            }
            
            console.log(`✅ [verificarTelefonoUnico] Teléfono ${telefono} está disponible`);
            return true;
            
        } catch (error) {
            console.error('❌ [verificarTelefonoUnico] Error validando teléfono único:', error);
            return "Error validando el teléfono. Por favor, intente nuevamente.";
        }
    };

    // FUNCIÓN MEJORADA PARA FORMATEAR MENSAJES DE ERROR
    const formatearMensajeError = (mensaje, campo) => {
        if (!mensaje) return '';
        
        let mensajeStr = typeof mensaje === 'object' ? JSON.stringify(mensaje) : String(mensaje);
        
        // Traducciones específicas para tutores
        const traducciones = {
            'tutor with this dni tutor already exists.': 'Ya existe un tutor con este DNI',
            'tutor with this dni tutor already exists': 'Ya existe un tutor con este DNI',
            'tutor with this correo tutor already exists.': 'Ya existe un tutor con este correo electrónico',
            'tutor with this correo tutor already exists': 'Ya existe un tutor con este correo electrónico',
            'tutor with this telefono tutor already exists.': 'Ya existe un tutor con este teléfono',
            'tutor with this telefono tutor already exists': 'Ya existe un tutor con este teléfono',
            'dni tutor already exists': 'Ya existe un tutor con este DNI',
            'correo tutor already exists': 'Ya existe un tutor con este correo electrónico',
            'telefono tutor already exists': 'Ya existe un tutor con este teléfono',
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
            .replace(/\s+/g, ' ')
            .trim();
        
        // Capitalizar primera letra
        if (mensajeTraducido.length > 0) {
            mensajeTraducido = mensajeTraducido.charAt(0).toUpperCase() + mensajeTraducido.slice(1);
        }
        
        return mensajeTraducido;
    };

    // FUNCIÓN DE VERIFICACIÓN DE DNI ÚNICO ACTUALIZADA
    const verificarDNIUnico = async (dni) => {
        if (!dni || dni === tutorData?.dni_tutor?.toString()) return true;
        
        try {
            console.log(`🔍 [verificarDNIUnico] Verificando DNI: ${dni}`);
            
            // PRIMERO: Verificar si el DNI pertenece a un alumno
            const verificacionAlumno = await verificarDNIEnAlumnos(dni);
            if (verificacionAlumno.esAlumno) {
                console.log(`❌ [verificarDNIUnico] DNI ${dni} pertenece a un alumno - BLOQUEANDO`);
                return verificacionAlumno.mensaje;
            }
            
            // SEGUNDO: Verificar si el DNI pertenece a otro tutor activo
            const response = await verificarTutorActivoByDni(parseInt(dni, 10));
            if (response.existe && response.data && response.data.id_tutor !== parseInt(idTutor)) {
                console.log(`❌ [verificarDNIUnico] DNI ${dni} pertenece a otro tutor - BLOQUEANDO`);
                return `Ya existe un tutor con este DNI: ${response.data.nombre_tutor} ${response.data.apellido_tutor}`;
            }
            
            console.log(`✅ [verificarDNIUnico] DNI ${dni} está disponible`);
            return true;
            
        } catch (error) {
            console.error('❌ [verificarDNIUnico] Error validando DNI único:', error);
            return "Error validando el DNI. Por favor, intente nuevamente.";
        }
    };

    // VERIFICACIÓN EN TIEMPO REAL DE DUPLICADOS - DNI
    useEffect(() => {
        let isMounted = true;

        const verificarDuplicadosTiempoReal = async () => {
            if (!dniTutorWatch || dniTutorWatch === tutorData?.dni_tutor?.toString()) {
                clearErrors("dni_tutor");
                return;
            }

            setVerificandoDuplicados(true);

            if (dniTutorWatch && dniTutorWatch.length >= 7) {
                try {
                    const resultado = await verificarDNIUnico(dniTutorWatch);
                    
                    if (!isMounted) return;

                    if (resultado !== true) {
                        setFormError("dni_tutor", {
                            type: "manual",
                            message: resultado
                        });
                    } else {
                        clearErrors("dni_tutor");
                    }
                } catch (error) {
                    if (!isMounted) return;
                    console.error('Error en verificación tiempo real:', error);
                    clearErrors("dni_tutor");
                }
            } else {
                clearErrors("dni_tutor");
            }

            setVerificandoDuplicados(false);
        };

        const timeoutId = setTimeout(verificarDuplicadosTiempoReal, 800);
        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [dniTutorWatch, tutorData?.dni_tutor, setFormError, clearErrors]);

    // VERIFICACIÓN EN TIEMPO REAL DE TELÉFONO DUPLICADO
    useEffect(() => {
        let isMounted = true;

        const verificarTelefonoDuplicadoTiempoReal = async () => {
            if (!telefonoTutorWatch || telefonoTutorWatch === tutorData?.telefono_tutor) {
                clearErrors("telefono_tutor");
                return;
            }

            setVerificandoDuplicados(true);

            // Solo verificar si el teléfono tiene al menos 8 dígitos
            const soloNumeros = telefonoTutorWatch.replace(/\D/g, '');
            if (soloNumeros.length >= 8) {
                try {
                    const resultado = await verificarTelefonoUnico(telefonoTutorWatch);
                    
                    if (!isMounted) return;

                    if (resultado !== true) {
                        setFormError("telefono_tutor", {
                            type: "manual",
                            message: resultado
                        });
                    } else {
                        clearErrors("telefono_tutor");
                    }
                } catch (error) {
                    if (!isMounted) return;
                    console.error('Error en verificación teléfono tiempo real:', error);
                    clearErrors("telefono_tutor");
                }
            } else {
                clearErrors("telefono_tutor");
            }

            setVerificandoDuplicados(false);
        };

        const timeoutId = setTimeout(verificarTelefonoDuplicadoTiempoReal, 800);
        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [telefonoTutorWatch, tutorData?.telefono_tutor, setFormError, clearErrors]);

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
        
        clearErrors("dni_tutor");
    };

    const mostrarEstadoDNI = () => {
        const dni = dniTutorWatch;
        
        if (!dni && dni !== 0) return null;
        
        const dniString = String(dni);
        const longitud = dniString.length;
        
        let clase = "char-counter";
        let mensaje = `${longitud}/8 dígitos`;
        
        if (longitud < 7) {
            clase += " warning";
            mensaje += " (mínimo 7)";
        } else if (longitud >= 7 && longitud <= 8) {
            clase += " success";
            mensaje += " ✓";
        }
        
        return <div className={clase}>{mensaje}</div>;
    };

    useEffect(() => {
        async function loadTutor() {
            try {
                setLoading(true);
                console.log('Cargando datos del tutor...');
                
                const response = await getTutorById(idTutor);
                console.log('Tutor cargado:', response.data);
                
                setTutorData(response.data);
                
                reset({
                    dni_tutor: response.data.dni_tutor,
                    nombre_tutor: response.data.nombre_tutor,
                    apellido_tutor: response.data.apellido_tutor,
                    genero_tutor: response.data.genero_tutor,
                    telefono_tutor: response.data.telefono_tutor,
                    correo_tutor: response.data.correo_tutor,
                });

            } catch (error) {
                console.error('Error cargando tutor:', error);
                setErrorState('Error al cargar los datos del tutor: ' + (error.response?.data?.message || error.message));
            } finally {
                setLoading(false);
            }
        }

        if (idTutor) {
            loadTutor();
        } else {
            setErrorState('No se proporcionó ID del tutor');
            setLoading(false);
        }
    }, [idTutor, reset]);

    // VALIDACIONES
    const validarDNI = (dni) => {
        if (!dni) return "El DNI es requerido";
        
        const stringDni = String(dni);
        const regex = /^[1-9]\d{6,7}$/;
        if (!regex.test(stringDni)) {
            return "El DNI debe tener entre 7 y 8 dígitos y no puede comenzar con 0";
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

    const validarTelefono = (telefono) => {
        if (!telefono) return "El teléfono es requerido";
        
        const stringTelefono = String(telefono);
        const regex = /^(\+54|54)?\s?(9?\d{2})?[-\s]?(\d{3,4})[-\s]?(\d{3,4})$/;
        if (!regex.test(stringTelefono.replace(/\s/g, ''))) {
            return "Formato de teléfono inválido. Ejemplo: +54 11 1234-5678";
        }
        
        const soloNumeros = stringTelefono.replace(/\D/g, '');
        if (soloNumeros.length < 10) {
            return "El teléfono debe tener al menos 10 dígitos";
        }
        
        return true;
    };

    const validarEmail = (email) => {
        if (!email) return "El email es requerido";
        
        const stringEmail = String(email);
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(stringEmail)) {
            return "El formato del email no es válido";
        }
        
        if (stringEmail.length > 100) {
            return "El email no puede tener más de 100 caracteres";
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

    // ONSUBMIT MEJORADO - CON VALIDACIÓN FINAL DE DNI EN ALUMNOS Y TELÉFONO
    const onSubmit = async (data) => {
        try {
            setLoading(true);
            clearErrors();
            
            console.log('Datos a actualizar:', data);

            // Validaciones básicas
            const nombreTrimmed = data.nombre_tutor.trim();
            const apellidoTrimmed = data.apellido_tutor.trim();
            
            if (nombreTrimmed.length === 0) {
                setFormError("nombre_tutor", {
                    type: "manual",
                    message: "El nombre no puede estar vacío o contener solo espacios"
                });
                return;
            }
            
            if (apellidoTrimmed.length === 0) {
                setFormError("apellido_tutor", {
                    type: "manual", 
                    message: "El apellido no puede estar vacío o contener solo espacios"
                });
                return;
            }

            const dniString = String(data.dni_tutor || '');
            
            if (dniString.length < 7) {
                setFormError("dni_tutor", {
                    type: "manual",
                    message: "El DNI debe tener al menos 7 dígitos"
                });
                return;
            }

            // VERIFICACIÓN FINAL: DNI vs alumnos (doble seguridad)
            if (data.dni_tutor !== tutorData.dni_tutor.toString()) {
                console.log('🔍 Realizando verificación final de DNI vs alumnos...');
                const verificacionFinalAlumno = await verificarDNIEnAlumnos(data.dni_tutor);
                if (verificacionFinalAlumno.esAlumno) {
                    setFormError("dni_tutor", {
                        type: "manual",
                        message: verificacionFinalAlumno.mensaje
                    });
                    return;
                }
            }

            // Verificaciones finales de unicidad (tutores)
            if (data.dni_tutor !== tutorData.dni_tutor.toString()) {
                const validacionDNI = await verificarDNIUnico(data.dni_tutor);
                if (validacionDNI !== true) {
                    setFormError("dni_tutor", {
                        type: "manual",
                        message: validacionDNI
                    });
                    return;
                }
            }

            // ✅ VERIFICACIÓN: TELÉFONO DUPLICADO
            if (data.telefono_tutor !== tutorData.telefono_tutor) {
                console.log('🔍 Realizando verificación final de teléfono...');
                const validacionTelefono = await verificarTelefonoUnico(data.telefono_tutor);
                if (validacionTelefono !== true) {
                    setFormError("telefono_tutor", {
                        type: "manual",
                        message: validacionTelefono
                    });
                    return;
                }
            }

            // Preparar datos para la actualización
            const tutorActualizado = {
                dni_tutor: parseInt(data.dni_tutor, 10),
                nombre_tutor: nombreTrimmed,
                apellido_tutor: apellidoTrimmed,
                genero_tutor: data.genero_tutor,
                telefono_tutor: data.telefono_tutor.trim(),
                correo_tutor: data.correo_tutor.trim().toLowerCase(),
                estado_tutor: tutorData.estado_tutor
            };

            console.log('Enviando actualización:', tutorActualizado);
            
            try {
                await updateTutor(idTutor, tutorActualizado);
                console.log('Tutor actualizado exitosamente');
                showSuccess('¡Tutor actualizado exitosamente!', 'Tutor actualizado');
                
                setTimeout(() => {
                    navigate("/ListaTutores");
                }, 1500);

            } catch (updateError) {
                console.error('Error actualizando tutor:', updateError);
                
                // MANEJAR ERRORES DEL SERVIDOR COMO ERRORES DE FORMULARIO
                if (updateError.response?.data) {
                    const errores = updateError.response.data;
                    
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
                } else if (updateError.message) {
                    setFormError("root", {
                        type: "server",
                        message: formatearMensajeError(updateError.message)
                    });
                }
                
                throw updateError;
            }

        } catch (error) {
            console.error('Error actualizando tutor:', error);
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
                        <div className="loading">Cargando datos del tutor...</div>
                        <button onClick={() => navigate("/ListaTutores")} className="btn btn-secondary">Cancelar</button>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container">
                <header className="page-header">
                    <Perfil />
                </header>
                <main className="page-main">
                    <div className="container">
                        <div className="error-message">{error}</div>
                        <button onClick={() => navigate("/ListaTutores")} className="btn btn-secondary">Volver a la lista</button>
                    </div>
                </main>
            </div>
        );
    }

    if (!tutorData) {
        return (
            <div className="page-container">
                <header className="page-header">
                    <Perfil />
                </header>
                <main className="page-main">
                    <div className="container">
                        <div className="error-message">No se encontró el tutor</div>
                        <button onClick={() => navigate("/ListaTutores")} className="btn btn-secondary">Volver a la lista</button>
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
                        <button onClick={() => navigate("/ListaTutores")} className="btn btn-secondary">
                            ← Volver a la lista
                        </button>
                        <h1>Modificar Tutor</h1>
                    </div>

                    {/* Información actual del tutor */}
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <div className="card-header">
                            <h3>Información Actual del Tutor</h3>
                        </div>
                        <div className="card-body">
                            <div className="info-row">
                                <span className="label">Nombre:</span>
                                <span className="value">{tutorData.nombre_tutor} {tutorData.apellido_tutor}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">DNI:</span>
                                <span className="value">{tutorData.dni_tutor}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Teléfono:</span>
                                <span className="value">{tutorData.telefono_tutor}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Email:</span>
                                <span className="value">{tutorData.correo_tutor}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Estado:</span>
                                <span className={`badge ${tutorData.estado_tutor === 'Activo' ? 'badge-success' : 'badge-danger'}`}>
                                    {tutorData.estado_tutor}
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
                                        {...register("dni_tutor", { 
                                            required: "El DNI es requerido",
                                            validate: {
                                                dniValido: (value) => validarDNI(value),
                                            }
                                        })}
                                        className={`form-input ${errors.dni_tutor ? 'input-error' : ''} ${dniTutorWatch?.length >= 7 && !errors.dni_tutor ? 'input-success' : ''}`}
                                        placeholder="7 u 8 dígitos (sin puntos)"
                                        maxLength={8}
                                        onInput={limitarDNI}
                                    />
                                    {mostrarEstadoDNI()}
                                    <FormErrorMessage 
                                        error={errors.dni_tutor?.message} 
                                        verifying={verificandoDuplicados}
                                    />
                                    {dniTutorWatch?.length >= 7 && !errors.dni_tutor && (
                                        <FormSuccessMessage message="DNI válido" />
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Nombre *</label>
                                    <input
                                        type="text"
                                        {...register("nombre_tutor", { 
                                            required: "El nombre es requerido",
                                            validate: {
                                                nombreValido: (value) => validarNombre(value, "nombre")
                                            }
                                        })}
                                        className={`form-input ${errors.nombre_tutor ? 'input-error' : ''} ${nombreTutorWatch?.trim() && !errors.nombre_tutor ? 'input-success' : ''}`}
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
                                        {nombreTutorWatch ? nombreTutorWatch.trim().length : 0}/35 caracteres
                                    </div>
                                    <FormErrorMessage error={errors.nombre_tutor?.message} />
                                    {nombreTutorWatch?.trim() && !errors.nombre_tutor && (
                                        <FormSuccessMessage message="Nombre válido" />
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Apellido *</label>
                                    <input
                                        type="text"
                                        {...register("apellido_tutor", { 
                                            required: "El apellido es requerido",
                                            validate: {
                                                apellidoValido: (value) => validarNombre(value, "apellido")
                                            }
                                        })}
                                        className={`form-input ${errors.apellido_tutor ? 'input-error' : ''} ${apellidoTutorWatch?.trim() && !errors.apellido_tutor ? 'input-success' : ''}`}
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
                                        {apellidoTutorWatch ? apellidoTutorWatch.trim().length : 0}/35 caracteres
                                    </div>
                                    <FormErrorMessage error={errors.apellido_tutor?.message} />
                                    {apellidoTutorWatch?.trim() && !errors.apellido_tutor && (
                                        <FormSuccessMessage message="Apellido válido" />
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Género *</label>
                                    <select
                                        {...register("genero_tutor", { 
                                            required: "El género es obligatorio" 
                                        })}
                                        className={`form-select ${errors.genero_tutor ? 'input-error' : ''} ${watch("genero_tutor") && !errors.genero_tutor ? 'input-success' : ''}`}
                                    >
                                        <option value="">-- Seleccione --</option>
                                        <option value="M">Masculino</option>
                                        <option value="F">Femenino</option>
                                    </select>
                                    <FormErrorMessage error={errors.genero_tutor?.message} />
                                    {watch("genero_tutor") && !errors.genero_tutor && (
                                        <FormSuccessMessage message="Género seleccionado" />
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Teléfono *</label>
                                    <input
                                        type="text"
                                        {...register("telefono_tutor", { 
                                            required: "El teléfono es obligatorio",
                                            validate: {
                                                telefonoValido: (value) => validarTelefono(value),
                                            }
                                        })}
                                        className={`form-input ${errors.telefono_tutor ? 'input-error' : ''} ${telefonoTutorWatch?.trim() && !errors.telefono_tutor ? 'input-success' : ''}`}
                                        placeholder="Ej: +54 11 1234-5678"
                                        maxLength={20}
                                        onInput={(e) => limitarCaracteres(e, 20)}
                                        onBlur={(e) => {
                                            e.target.value = e.target.value.trim();
                                        }}
                                    />
                                    <div className="char-counter">
                                        {telefonoTutorWatch ? telefonoTutorWatch.trim().length : 0}/20 caracteres
                                    </div>
                                    <FormErrorMessage error={errors.telefono_tutor?.message} />
                                    {telefonoTutorWatch?.trim() && !errors.telefono_tutor && (
                                        <FormSuccessMessage message="Teléfono válido" />
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        {...register("correo_tutor", { 
                                            required: "El email es obligatorio",
                                            validate: {
                                                emailValido: (value) => validarEmail(value)
                                            }
                                        })}
                                        className={`form-input ${errors.correo_tutor ? 'input-error' : ''} ${correoTutorWatch?.trim() && !errors.correo_tutor ? 'input-success' : ''}`}
                                        placeholder="ejemplo@correo.com"
                                        maxLength={100}
                                        onInput={(e) => limitarCaracteres(e, 100)}
                                        onBlur={(e) => {
                                            e.target.value = e.target.value.trim();
                                        }}
                                    />
                                    <div className="char-counter">
                                        {correoTutorWatch ? correoTutorWatch.trim().length : 0}/100 caracteres
                                    </div>
                                    <FormErrorMessage error={errors.correo_tutor?.message} />
                                    {correoTutorWatch?.trim() && !errors.correo_tutor && (
                                        <FormSuccessMessage message="Email válido" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button 
                                type="button" 
                                onClick={() => navigate("/ListaTutores")}
                                className="btn btn-secondary"
                            >
                                Cancelar
                            </button>
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

export default ModificarTutor;