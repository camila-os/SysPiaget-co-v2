import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isFirstLogin } from '../api/auth.api';

function FirstLoginRoute({ children }) {
  const { auth } = useAuth();

  console.log('🔒 FirstLoginRoute - Verificando acceso:', {
    loading: auth.loading,
    isAuthenticated: auth.isAuthenticated,
    isFirstLogin: isFirstLogin()
  });

  if (auth.loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Verificando...</div>
      </div>
    );
  }

  if (!auth.isAuthenticated || !isFirstLogin()) {
    console.log('🚫 Acceso denegado a FirstLoginPassword - Redirigiendo...');
    
    if (!auth.isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    
    const role = auth.role;
    const routes = {
      'tutor': '/tutor',
      'secretario': '/secretario', 
      'profesor': '/profesor',
      'director': '/director',
      'preceptor_rector': '/preceptor_rector'
    };
    
    const targetRoute = routes[role] || '/';
    return <Navigate to={targetRoute} replace />;
  }

  return children;
}

export default FirstLoginRoute;