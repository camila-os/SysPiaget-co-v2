import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { crearParentesco } from '../../api/secretario.api';
import Button from "../../components/Buttons/Buttons";
import "./CrearParentescoModal.css";

const CrearParentescoModal = ({ 
  isOpen, 
  onClose, 
  onParentescoCreado,
  parentescosExistentes = [] 
}) => {
  const [nombreParentesco, setNombreParentesco] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalElement] = useState(() => document.createElement('div'));

  useEffect(() => {
    if (isOpen) {
      // Agregar el modal al body directamente
      document.body.appendChild(modalElement);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Limpiar cuando el componente se desmonte o se cierre el modal
        if (document.body.contains(modalElement)) {
          document.body.removeChild(modalElement);
        }
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, modalElement]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nombreParentesco.trim()) {
      setError('El nombre del parentesco es requerido');
      return;
    }

    // Verificar si ya existe
    const existe = parentescosExistentes.some(
      parentesco => parentesco.parentesco_nombre.toLowerCase() === nombreParentesco.toLowerCase().trim()
    );

    if (existe) {
      setError('Este parentesco ya existe');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await crearParentesco({
        parentesco_nombre: nombreParentesco.trim()
      });

      onParentescoCreado(response.data);
      setNombreParentesco('');
      onClose();
      
    } catch (error) {
      console.error('Error creando parentesco:', error);
      setError(error.response?.data?.error || 'Error al crear parentesco');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNombreParentesco('');
    setError('');
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Crear Nuevo Parentesco</h3>
          <button 
            className="modal-close-btn"
            onClick={handleClose}
            type="button"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="nombreParentesco">Nombre del Parentesco *</label>
            <input
              id="nombreParentesco"
              type="text"
              value={nombreParentesco}
              onChange={(e) => {
                setNombreParentesco(e.target.value);
                setError('');
              }}
              placeholder="Ej: Padre, Madre, Abuelo, Tío, etc."
              disabled={loading}
              autoFocus
            />
            {error && <span className="error-message">{error}</span>}
          </div>

          <div className="modal-actions">
            <Button
              variant="cancel"
              type="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            
            <Button
              variant="next"
              type="solid"
              onClick={handleSubmit}
              disabled={loading || !nombreParentesco.trim()}
            >
              {loading ? 'Creando...' : 'Crear Parentesco'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalElement);
};

export default CrearParentescoModal;