// src/contexts/RegistrationContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const RegistrationContext = createContext();

export const RegistrationProvider = ({ children }) => {
  // Estado inicial desde localStorage
  const getInitialState = () => {
    try {
      const saved = localStorage.getItem('registrationData');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          currentStep: parsed.currentStep || 1,
          alumnoData: parsed.alumnoData || null,
          tutorData: parsed.tutorData || null,
          tutorExistente: parsed.tutorExistente || false,
          isCompleted: parsed.isCompleted || false
        };
      }
    } catch (error) {
      console.error('Error loading registration data:', error);
    }
    return {
      currentStep: 1,
      alumnoData: null,
      tutorData: null,
      tutorExistente: false,
      isCompleted: false
    };
  };

  const [registrationState, setRegistrationState] = useState(getInitialState);

  // Guardar en localStorage CADA VEZ que cambie el estado
  useEffect(() => {
    localStorage.setItem('registrationData', JSON.stringify(registrationState));
    console.log('💾 Saved to localStorage:', registrationState); // Para debug
  }, [registrationState]);

  const setAlumnoData = (data) => {
    setRegistrationState(prev => ({
      ...prev,
      alumnoData: data,
      currentStep: 2 // ✅ Avanza automáticamente al paso 2
    }));
  };

    const setTutorData = (data, esExistente) => {
        console.log('🏛️  CONTEXTO - setTutorData llamado:', {
            data,
            esExistente,
            dataAnterior: registrationState.tutorData
        });

    setRegistrationState(prev => ({
        ...prev,
        tutorData: data,
        tutorExistente: esExistente
    }));
};

  const setTutorExistente = (esExistente) => {
    setRegistrationState(prev => ({
      ...prev,
      tutorExistente: esExistente
    }));
  };

  const completeRegistration = () => {
    setRegistrationState(prev => ({
      ...prev,
      isCompleted: true
    }));
  };

  const goToStep = (step) => {
    setRegistrationState(prev => ({
      ...prev,
      currentStep: step
    }));
  };

  const resetRegistration = () => {
    // 🔥 LIMPIAR localStorage también
    localStorage.removeItem('registrationData');
    setRegistrationState({
      currentStep: 1,
      alumnoData: null,
      tutorData: null,
      tutorExistente: false,
      isCompleted: false
    });
  };

  const value = {
    // Estados
    currentStep: registrationState.currentStep,
    alumnoData: registrationState.alumnoData,
    tutorData: registrationState.tutorData,
    tutorExistente: registrationState.tutorExistente,
    isCompleted: registrationState.isCompleted,
    
    // Funciones
    setAlumnoData,
    setTutorData,
    setTutorExistente,
    completeRegistration,
    goToStep,
    resetRegistration
  };

  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration debe usarse dentro de RegistrationProvider');
  }
  return context;
};