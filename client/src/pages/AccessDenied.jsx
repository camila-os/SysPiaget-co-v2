import React from 'react';
import { useNavigate } from 'react-router-dom';

function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      textAlign: 'center'
    }}>
      <h1 style={{ color: '#f44336', fontSize: '48px' }}>⛔</h1>
      <h2>Acceso Denegado</h2>
      <p>No tienes permisos para acceder a esta página.</p>
      <button 
        onClick={() => navigate('/')}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#2196f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Volver al Login
      </button>
    </div>
  );
}

export default AccessDenied;