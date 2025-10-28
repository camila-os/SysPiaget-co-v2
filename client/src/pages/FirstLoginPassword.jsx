import "../style/FirstLoginPassword.css";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/auth.api";
import { useAuth } from "../contexts/AuthContext";
import showIcon from "../style/logos_e_imagenes/show.png";
import hideIcon from "../style/logos_e_imagenes/hidden.png";

function FirstLoginPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const { handleLogout } = useAuth();

  const handleBeforeUnload = useCallback((event) => {
    event.preventDefault();
    event.returnValue = "¿Estás seguro de que quieres salir? Debes cambiar tu contraseña para continuar.";
    return event.returnValue;
  }, []);

  const handlePopState = useCallback((event) => {
    console.log('🚫 Bloqueando navegación hacia atrás...');
    window.history.pushState(null, '', window.location.href);
    setError("Debes cambiar tu contraseña antes de poder navegar a otras páginas.");
  }, [setError]);

  useEffect(() => {
    const storedUsername = localStorage.getItem("name");
    console.log('🔍 FirstLoginPassword - username en localStorage:', storedUsername);
    
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      console.warn('⚠️ No se encontró username en localStorage');
      setUsername("Usuario");
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handleBeforeUnload, handlePopState]);

  const handleChangePassword = async () => {
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log('🔄 Cambiando contraseña...');
      
      const response = await api.post("/login/cambiar-password/", { 
        nueva: password 
      });
      
      console.log('✅ Contraseña cambiada exitosamente:', response.data);
      
      localStorage.setItem("primer_login", "false");
      
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      
      console.log('🔒 Cerrando sesión después de cambiar contraseña...');
      handleLogout();
      
    } catch (err) {
      console.error('❌ Error al cambiar contraseña:', err);
      setError(err.response?.data?.message || err.message || "Error al cambiar la contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleChangePassword();
    }
  };

  return (
    <div className="password-change-container">
      <div className="password-change-card">
        <div className="password-change-header">
          <div className="security-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9V11C3.9 11 3 11.9 3 13V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V13C21 11.9 20.1 11 19 11V9C19 5.13 15.87 2 12 2ZM12 4C14.76 4 17 6.24 17 9V11H7V9C7 6.24 9.24 4 12 4ZM12 18C10.9 18 10 17.1 10 16C10 14.9 10.9 14 12 14C13.1 14 14 14.9 14 16C14 17.1 13.1 18 12 18Z" fill="currentColor"/>
            </svg>
          </div>
          <h2>Cambio de Contraseña Requerido</h2>
          <p className="welcome-message">
            Bienvenido{username ? `, ${username}` : ''}. Es la primera vez que inicias sesión. <strong>Debes cambiar tu contraseña para continuar.</strong>
          </p>
          <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
            ⚠️ No podrás navegar a otras páginas hasta completar este paso.
          </p>
        </div>

        <div className="password-change-form">
          <div className="input-group">
            <label htmlFor="password">Nueva Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="Ingrese su nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className={error && password.length < 6 ? "error" : ""}
            />
            {password.length > 0 && password.length < 6 && (
              <span className="password-hint">Mínimo 6 caracteres</span>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="confirm">Confirmar Contraseña</label>
            <input
              id="confirm"
              type="password"
              placeholder="Confirme su nueva contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyPress={handleKeyPress}
              className={error && password !== confirm ? "error" : ""}
            />
          </div>

          {error && (
            <div className="error-message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
              </svg>
              {error}
            </div>
          )}

          <button 
            onClick={handleChangePassword} 
            disabled={isLoading || password.length < 6 || password !== confirm}
            className={`submit-button ${isLoading ? "loading" : ""}`}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Actualizando...
              </>
            ) : (
              "Actualizar Contraseña y Continuar"
            )}
          </button>

          <div className="password-requirements">
            <h4>Requisitos de seguridad:</h4>
            <ul>
              <li className={password.length >= 6 ? "met" : ""}>Mínimo 6 caracteres</li>
              <li>Recomendado usar mayúsculas, minúsculas y números</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FirstLoginPassword;