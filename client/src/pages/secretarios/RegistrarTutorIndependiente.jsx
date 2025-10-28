import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router";
import { createTutores } from '../../api/secretario.api';
import "../../style/RegistrarTutor.css";
import Perfil from "../../components/Perfil";
import Button from "../../components/Buttons/Buttons";
import FormTutorNuevoSimple from './FormTutorNuevoSimple'; // ✅ Usa el SIMPLE

function RegistrarTutorIndependiente() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverErrors, setServerErrors] = useState({});

  const handleCancelar = () => {
    navigate("/secretario");
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');

      const tutorData = {
        dni_tutor: parseInt(data.dni_tutor, 10),
        nombre_tutor: data.nombre_tutor.trim(),
        apellido_tutor: data.apellido_tutor.trim(),
        genero_tutor: data.genero_tutor,
        telefono_tutor: data.telefono_tutor.trim(),
        correo_tutor: data.correo_tutor.trim().toLowerCase(),
        estado_tutor: 'Activo',
        primer_login: true
      };
      
      await createTutores(tutorData);
      alert('✅ ¡Tutor registrado exitosamente!');
      navigate("/secretario");
      
    } catch (error) {
      setError(error.response?.data?.error || 'Error al crear tutor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <Perfil />
      </header>
      
      <main className="page-main">
        <div className='alumno-form-container'>
          <div className="form-header">
            <h2>Registro de Tutor</h2>
            <Button
              variant="cancel"
              type="outline"
              size="square"
              onClick={handleCancelar}
              className="close-button"
            >
              ×
            </Button>
          </div>
          
          <div className='alumno-info'>
            <h4>📝 Registrar Nuevo Tutor</h4>
            <p><strong>Complete los datos del tutor.</strong> La vinculación con alumnos se realiza posteriormente.</p>
          </div>

          <FormTutorNuevoSimple
            loading={loading}
            serverErrors={serverErrors}
            onVolver={handleCancelar}
            onSubmit={onSubmit}
          />
        </div>
      </main>
    </div>
  );
}

export default RegistrarTutorIndependiente;