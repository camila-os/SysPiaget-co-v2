import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { loginUser, saveUserData } from "../api/auth.api";
import "../style/Login.css";
import showIcon from "../style/logos_e_imagenes/show.png";
import hideIcon from "../style/logos_e_imagenes/hidden.png";

// Custom hook para manejo de estado del formulario
const useLoginForm = () => {
  const [formState, setFormState] = useState({
    dni: "",
    password: "",
    showPassword: false,
    message: "",
    loading: false
  });

  const updateFormState = useCallback((updates) => {
    setFormState(prev => ({ ...prev, ...updates }));
  }, []);

  return { formState, updateFormState };
};

// Custom hook para manejo de mensajes
const useMessageHandler = () => {
  const [message, setMessage] = useState("");
  const messageRef = useRef("");

  const setMessageWithRef = useCallback((newMessage) => {
    setMessage(newMessage);
    messageRef.current = newMessage;
  }, []);

  const clearMessage = useCallback(() => {
    setMessage("");
    messageRef.current = "";
  }, []);

  return { message, setMessage: setMessageWithRef, clearMessage, messageRef };
};

// Utility functions
const ErrorMessages = {
  NETWORK_ERROR: "Error de conexión. Verifique su internet.",
  UNAUTHORIZED: "Credenciales incorrectas. Verifique su DNI y contraseña.",
  NO_TOKEN: "Error del servidor: No se recibió token de acceso",
  NO_ROLE: "Error del servidor: No se recibió rol de usuario",
  EMPTY_FIELDS: "Por favor complete todos los campos",
  UNKNOWN_ROLE: (rol) => `Rol desconocido: ${rol}`,
  DEFAULT: "Error al iniciar sesión"
};

const getErrorMessage = (error) => {
  if (error.message.includes("Network Error")) return ErrorMessages.NETWORK_ERROR;
  if (error.message.includes("401") || error.message.includes("Credenciales")) return ErrorMessages.UNAUTHORIZED;
  return error.message || ErrorMessages.DEFAULT;
};

const RoleRoutes = {
  "tutor": "/tutor",
  "secretario": "/secretario", 
  "profesor": "/profesor",
  "director": "/director",
  "preceptor_rector": "/preceptor_rector"
};

function Login({ onSuccess }) {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  
  const { formState, updateFormState } = useLoginForm();
  const { dni, password, showPassword, loading } = formState;
  const { message, setMessage, clearMessage } = useMessageHandler();
  
  const isSubmitting = useRef(false);

  // Efecto para mensajes persistentes
  useEffect(() => {
    if (message) {
      setMessage(message);
    }
  }, [message]);

  // Handlers optimizados
  const createInputHandler = useCallback((field) => (e) => {
    updateFormState({ [field]: e.target.value });
    clearMessage();
  }, [updateFormState, clearMessage]);

  const handleDniChange = createInputHandler('dni');
  const handlePasswordChange = createInputHandler('password');

  const togglePasswordVisibility = useCallback(() => {
    updateFormState({ showPassword: !showPassword });
  }, [showPassword, updateFormState]);

  // Lógica de redirección y auth
  const handleAuthSuccess = useCallback((data) => {
    console.log('💾 Guardando datos de usuario...');
    saveUserData(data);

    const authData = {
      user: { 
        role: data.rol.toLowerCase(), 
        name: data.username 
      },
      role: data.rol.toLowerCase(),
      userName: data.username,
      loading: false,
      isAuthenticated: true
    };

    console.log('🔄 Actualizando contexto de autenticación...');
    setAuth(authData);

    const isFirstLogin = data.primer_login === true || data.primer_login === "true";
    
    if (isFirstLogin) {
      console.log('🔄 Redirigiendo a cambio de contraseña (primer login)');
      navigate("/first-login-password", { 
        state: { username: data.username }, 
        replace: true 
      });
      return;
    }

    console.log('✅ Login exitoso - redirigiendo según rol...');
    const rol = data.rol.toLowerCase();
    const route = RoleRoutes[rol];
    
    if (route) {
      navigate(route, { replace: true });
      onSuccess?.();
    } else {
      setMessage(ErrorMessages.UNKNOWN_ROLE(rol));
    }
  }, [navigate, setAuth, onSuccess, setMessage]);

  // Validaciones
  const validateForm = useCallback(() => {
    if (!dni.trim() || !password.trim()) {
      setMessage(ErrorMessages.EMPTY_FIELDS);
      return false;
    }
    return true;
  }, [dni, password, setMessage]);

  const validateResponse = useCallback((data) => {
    if (!data.access) {
      console.error('❌ ERROR: No se recibió access token');
      setMessage(ErrorMessages.NO_TOKEN);
      return false;
    }
    if (!data.rol) {
      console.error('❌ ERROR: No se recibió rol');
      setMessage(ErrorMessages.NO_ROLE);
      return false;
    }
    return true;
  }, [setMessage]);

  // Login principal optimizado
  const handleLogin = useCallback(async (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (isSubmitting.current) {
      console.log('⏳ Login en progreso, ignorando envío duplicado');
      return;
    }

    if (!validateForm()) return;

    isSubmitting.current = true;
    updateFormState({ loading: true });
    clearMessage();

    try {
      console.log('🔐 Iniciando proceso de login...');
      const data = await loginUser(dni, password);
      console.log('✅ Respuesta del login recibida:', data);

      if (!validateResponse(data)) return;
      
      await handleAuthSuccess(data);

    } catch (error) {
      console.error('❌ Error durante el login:', error);
      setMessage(getErrorMessage(error));
    } finally {
      console.log('🏁 Finalizando proceso de login');
      updateFormState({ loading: false });
      setTimeout(() => {
        isSubmitting.current = false;
      }, 1000);
    }
  }, [dni, password, validateForm, validateResponse, handleAuthSuccess, updateFormState, clearMessage, setMessage]);

  // Handler para submit con botón
  const handleButtonClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    handleLogin();
  }, [handleLogin]);

  // Handler para tecla Enter
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleLogin(e);
    }
  }, [handleLogin]);

  // Memoizado components
  const messageDisplay = useMemo(() => {
    if (!message) return null;
    
    return (
      <div 
        className="message error-message"
        style={{ 
          padding: '15px', 
          margin: '20px 0', 
          backgroundColor: '#ffebee', 
          border: '2px solid #f44336',
          borderRadius: '8px',
          color: '#c62828',
          fontWeight: 'bold',
          fontSize: '15px',
          textAlign: 'center'
        }}
        key={message}
      >
        {message}
      </div>
    );
  }, [message]);

  const passwordInput = useMemo(() => (
    <div className="password-wrapper">
      <input
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={handlePasswordChange}
        required
        disabled={loading}
        placeholder="Ingrese su contraseña"
        onKeyDown={handleKeyDown}
      />
      <button
        type="button"
        className="toggle-password"
        onClick={togglePasswordVisibility}
        disabled={loading}
      >
        <img
          src={showPassword ? showIcon : hideIcon}
          alt={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="eye-icon"
        />
      </button>
    </div>
  ), [showPassword, password, loading, handlePasswordChange, handleKeyDown, togglePasswordVisibility]);

  return (
    <div className="login-page">
      <div className="login-card-row">
        <div className="login-left">
          <div className="login-institute">
            <img
              src="https://iili.io/KTpR0j1.png"
              alt="Logo Instituto"
              className="logo"
            />
            <h2>Instituto Jean Piaget</h2>
            <p className="institute-number">N°8048</p>
          </div>
        </div>

        <div className="login-right">
          <div className="login-header">INICIAR SESIÓN</div>

          {messageDisplay}

          <div className="login-form">
            <label>USUARIO</label>
            <input
              type="text"
              value={dni}
              onChange={handleDniChange}
              required
              disabled={loading}
              placeholder="Ingrese su DNI"
              onKeyDown={handleKeyDown}
            />

            <label>Contraseña</label>
            {passwordInput}

            <button 
              type="button" 
              className="btn-red"
              onClick={handleButtonClick}
              disabled={loading}
            >
              {loading ? "Iniciando sesión..." : "Ingresar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;