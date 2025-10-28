import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthConfirmModal from './AuthConfirmModal';
import { isFirstLogin } from '../api/auth.api';

function PublicRoute({ children }) {
  const { auth, handleLogout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectToFirstLogin, setRedirectToFirstLogin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    console.log('🔐 PublicRoute - Estado de autenticación:', {
      loading: auth.loading,
      isAuthenticated: auth.isAuthenticated,
      role: auth.role,
      currentPath: location.pathname
    });

    if (location.pathname === '/first-login-password') {
      console.log('📍 En ruta first-login-password - omitiendo lógica de PublicRoute');
      return;
    }

    if (!auth.loading) {
      if (auth.isAuthenticated) {
        if (isFirstLogin()) {
          console.log('🔄 Usuario con primer login detectado - Redirigiendo a /first-login-password');
          setRedirectToFirstLogin(true);
          setShowModal(false);
        } else {
          console.log('🚨 Usuario autenticado detectado en ruta pública - Mostrando modal');
          setShowModal(true);
          setShouldRedirect(false);
          setRedirectToFirstLogin(false);
        }
      } else {
        console.log('👤 Usuario no autenticado - Mostrando login');
        setShowModal(false);
        setShouldRedirect(false);
        setRedirectToFirstLogin(false);
      }
    }
  }, [auth.loading, auth.isAuthenticated, auth.role, location.pathname]);

  const handleConfirmLogout = useCallback(() => {
    console.log('✅ Usuario confirmó cerrar sesión');
    handleLogout();
    setShowModal(false);
    setShouldRedirect(false);
  }, [handleLogout]);

  const handleCancel = useCallback(() => {
    console.log('❌ Usuario canceló - Redirigiendo a dashboard');
    setShowModal(false);
    setShouldRedirect(true);
  }, []);

  if (auth.loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div>Verificando sesión...</div>
        <small>Por favor espere</small>
      </div>
    );
  }

  if (redirectToFirstLogin && auth.isAuthenticated && location.pathname !== '/first-login-password') {
    console.log('↪️ Redirigiendo a /first-login-password (primer login)');
    return <Navigate to="/first-login-password" replace />;
  }

  if (location.pathname === '/first-login-password') {
    return children;
  }

  if (!auth.isAuthenticated) {
    return children;
  }

  if (shouldRedirect && auth.isAuthenticated) {
    const rolePath = getRolePath(auth.role);
    console.log('↪️ Redirigiendo a:', rolePath);
    return <Navigate to={rolePath} replace />;
  }

  return (
    <>
      {children}
      <AuthConfirmModal
        isOpen={showModal}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancel}
        userName={auth.userName}
      />
    </>
  );
}

function getRolePath(role) {
  const rolePaths = {
    'director': '/director',
    'secretario': '/secretario', 
    'profesor': '/profesor',
    'preceptor_rector': '/preceptor_rector',
    'tutor': '/tutor'
  };
  return rolePaths[role?.toLowerCase()] || '/director';
}

export default React.memo(PublicRoute);