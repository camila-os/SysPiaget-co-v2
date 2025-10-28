import React, { useState, useEffect } from 'react';
import { createColegio } from '../../api/secretario.api';
import { 
  validarNombreColegio, 
  validarNumeroColegio, 
  validarFormularioCompleto,
  nombreColegioInputProps,
  numeroColegioInputProps 
} from '../validations/colegioValidations';
import './CrearColegioModal.css';

const CrearColegioModal = ({ 
  isOpen, 
  onClose, 
  onColegioCreado, 
  nombreSugerido = '',
  colegiosExistentes = [] 
}) => {
  const [formData, setFormData] = useState({
    nombre_colegio_procedencia: nombreSugerido,
    nro_colegio_procedencia: ''
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [erroresCampos, setErroresCampos] = useState({
    nombre: '',
    numero: ''
  });

  // Resetear el form cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        nombre_colegio_procedencia: nombreSugerido,
        nro_colegio_procedencia: ''
      });
      setError(null);
      setErroresCampos({ nombre: '', numero: '' });
      setCargando(false);
    }
  }, [isOpen, nombreSugerido]);

  // Validar campo individual en tiempo real
  const validarCampo = (name, value) => {
    switch (name) {
      case 'nombre_colegio_procedencia':
        return validarNombreColegio(value, colegiosExistentes);
      case 'nro_colegio_procedencia':
        return validarNumeroColegio(value, colegiosExistentes);
      default:
        return null;
    }
  };

  // Manejar cambios en los inputs con validación en tiempo real
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Prevenir espacios múltiples en nombre
    let valorProcesado = value;
    if (name === 'nombre_colegio_procedencia') {
      valorProcesado = value.replace(/\s{2,}/g, ' ');
    }
    
    // Prevenir caracteres no numéricos en número
    if (name === 'nro_colegio_procedencia') {
      valorProcesado = value.replace(/[^\d]/g, '');
    }

    setFormData(prev => ({
      ...prev,
      [name]: valorProcesado
    }));

    // Validación en tiempo real
    const errorCampo = validarCampo(name, valorProcesado);
    setErroresCampos(prev => ({
      ...prev,
      [name === 'nombre_colegio_procedencia' ? 'nombre' : 'numero']: errorCampo || ''
    }));

    setError(null);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar todos los campos
    const errorNombre = validarNombreColegio(formData.nombre_colegio_procedencia, colegiosExistentes);
    const errorNumero = validarNumeroColegio(formData.nro_colegio_procedencia, colegiosExistentes);
    
    setErroresCampos({
      nombre: errorNombre || '',
      numero: errorNumero || ''
    });

    // Si hay errores, no enviar
    if (errorNombre || errorNumero) {
      setError('Por favor corrige los errores en el formulario');
      return;
    }

    try {
      setCargando(true);
      setError(null);

      // Preparar datos para enviar
      const datosEnvio = {
        nombre_colegio_procedencia: formData.nombre_colegio_procedencia.trim()
      };

      // Solo agregar número si se proporcionó y es válido
      if (formData.nro_colegio_procedencia && formData.nro_colegio_procedencia.trim() !== '') {
        datosEnvio.nro_colegio_procedencia = parseInt(formData.nro_colegio_procedencia);
      }

      const response = await createColegio(datosEnvio);
      const colegioCreado = response.data;

      // Cerrar modal y notificar
      onColegioCreado(colegioCreado);
      onClose();

    } catch (error) {
      console.error('Error creando colegio:', error);
      setError(error.response?.data?.error || 'Error al crear el colegio');
    } finally {
      setCargando(false);
    }
  };

  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Crear Nuevo Colegio</h2>
          <button 
            type="button" 
            className="modal-close"
            onClick={onClose}
            disabled={cargando}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="nombre_colegio_procedencia">
              Nombre del Colegio *
            </label>
            <input
              type="text"
              id="nombre_colegio_procedencia"
              name="nombre_colegio_procedencia"
              value={formData.nombre_colegio_procedencia}
              onChange={handleInputChange}
              placeholder="Ingrese el nombre completo del colegio"
              disabled={cargando}
              autoFocus
              {...nombreColegioInputProps}
            />
            {erroresCampos.nombre && (
              <div className="error-campo">
                {erroresCampos.nombre}
              </div>
            )}
            <div className="form-help">
            Minimo 3 cifras. No puede repetirse con otros colegios.
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="nro_colegio_procedencia">
              Número de Colegio (Opcional)
            </label>
            <input  
              type="text" // Usamos text para mejor control
              id="nro_colegio_procedencia"
              name="nro_colegio_procedencia"
              value={formData.nro_colegio_procedencia}
              onChange={handleInputChange}
              placeholder="Dejar vacío si se desconoce"
              disabled={cargando}
              {...numeroColegioInputProps}
            />
            {erroresCampos.numero && (
              <div className="error-campo">
                {erroresCampos.numero}
              </div>
            )}
            <div className="form-help">
              Máximo 5 cifras. No puede repetirse con otros colegios.
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={cargando}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando || erroresCampos.nombre || erroresCampos.numero}
              className="btn btn-primary"
            >
              {cargando ? (
                <>
                  <span className="spinner"></span>
                  Creando...
                </>
              ) : (
                'Crear Colegio'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearColegioModal;