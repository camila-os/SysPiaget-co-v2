import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function PrivateRouter({ children, role }) {
  const { auth } = useAuth();
  const location = useLocation();

  console.log('🔒 PrivateRouter - Estado:', {
    path: location.pathname,
    loading: auth.loading,
    isAuthenticated: auth.isAuthenticated,
    userRole: auth.role,
    requiredRole: role
  });

  if (auth.loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Cargando...</div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    console.log('🚫 No autenticado - redirigiendo a login');
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const hasValidRole = !role || role.toLowerCase() === auth.role?.toLowerCase();
  if (!hasValidRole) {
    console.warn(`⛔ Acceso denegado. Rol requerido: ${role}, Rol del usuario: ${auth.role}`);
    return <Navigate to="/access-denied" replace />;
  }

  console.log('✅ Acceso permitido');
  return children;
}

export default React.memo(PrivateRouter);