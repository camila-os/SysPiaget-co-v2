import React from "react";

function AuthConfirmModal({ isOpen, onConfirm, onCancel, userName }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#333' }}>Confirmar</h3>
        <p style={{ marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Actualmente ha iniciado sesión como <strong>{userName}</strong>, 
          necesita salir antes de volver a entrar con un usuario diferente.
        </p>
        <div style={{ 
          marginTop: '1.5rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 1.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '0.5rem 1.5rem',
              border: 'none',
              borderRadius: '4px',
              background: '#dc3545',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthConfirmModal;