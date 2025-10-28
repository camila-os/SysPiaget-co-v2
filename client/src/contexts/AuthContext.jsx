import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { checkAuth, getUserRole, getUserName, logoutUser, getToken } from '../api/auth.api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    user: null,
    role: null,
    userName: null,
    loading: true,
    isAuthenticated: false
  });

  const initializeAuth = useCallback(async () => {
    try {
      console.log('🔄 Iniciando verificación de autenticación...');
      
      const token = getToken();
      const role = getUserRole();
      const name = getUserName();
      
      console.log('📝 Datos en localStorage:', { 
        token: !!token, 
        role, 
        name,
        primer_login: localStorage.getItem("primer_login")
      });

      if (!token) {
        console.log('🚫 No hay token - usuario no autenticado');
        setAuth({
          user: null,
          role: null,
          userName: null,
          loading: false,
          isAuthenticated: false
        });
        return;
      }

      console.log('🔐 Validando token con el servidor...');
      await checkAuth();
      
      console.log('✅ Token válido - usuario autenticado');
      setAuth({
        user: { role, name },
        role,
        userName: name,
        loading: false,
        isAuthenticated: true
      });

    } catch (error) {
      console.error('❌ Error en verificación:', error.message);
      
      const token = getToken();
      const role = getUserRole();
      const name = getUserName();
      
      if (token && role) {
        console.log('🔄 Usando datos de localStorage como fallback');
        setAuth({
          user: { role, name },
          role,
          userName: name,
          loading: false,
          isAuthenticated: true
        });
      } else {
        console.log('🚫 No autenticado - limpiando estado');
        setAuth({
          user: null,
          role: null,
          userName: null,
          loading: false,
          isAuthenticated: false
        });
      }
    }
  }, []);

  useEffect(() => {
    console.log('🚀 AuthProvider montado - verificando autenticación');
    initializeAuth();
  }, [initializeAuth]);

  const handleLogout = useCallback(() => {
    console.log('👋 Cerrando sesión...');
    logoutUser();
    setAuth({
      user: null,
      role: null,
      userName: null,
      loading: false,
      isAuthenticated: false
    });
  }, []);

  const refreshAuth = useCallback(() => {
    console.log('🔄 Refrescando autenticación...');
    const token = getToken();
    const role = getUserRole();
    const name = getUserName();
    
    if (token && role) {
      setAuth({
        user: { role, name },
        role,
        userName: name,
        loading: false,
        isAuthenticated: true
      });
      return true;
    }
    return false;
  }, []);

  const value = React.useMemo(() => ({
    auth,
    setAuth,
    handleLogout,
    refreshAuth
  }), [auth, handleLogout, refreshAuth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};