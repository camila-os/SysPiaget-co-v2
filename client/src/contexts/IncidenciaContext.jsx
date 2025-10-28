import React, { createContext, useContext, useState } from 'react';

const IncidenciaContext = createContext();

export const useIncidencia = () => {
  const context = useContext(IncidenciaContext);
  if (!context) {
    throw new Error('useIncidencia debe usarse dentro de un IncidenciaProvider');
  }
  return context;
};

export const IncidenciaProvider = ({ children }) => {
  const [formData, setFormData] = useState({
    alumnos: [],
    filtros: {},
    tipo_incidencia: '',
    incidencia: '',
    id_lugar: '',
    cantidad_dias: '',
    descripcion_caso: '',
    medidasPorAlumno: {} // ✅ AGREGAR ESTO
  });

  const updateFormData = (newData) => {
    setFormData(prev => ({
      ...prev,
      ...newData
    }));
  };

  const resetFormData = () => {
    setFormData({
      alumnos: [],
      filtros: {},
      tipo_incidencia: '',
      incidencia: '',
      id_lugar: '',
      cantidad_dias: '',
      descripcion_caso: '',
      medidasPorAlumno: {} // ✅ AGREGAR ESTO TAMBIÉN
    });
  };

  const value = {
    formData,
    setFormData: updateFormData,
    resetFormData
  };

  return (
    <IncidenciaContext.Provider value={value}>
      {children}
    </IncidenciaContext.Provider>
  );
};