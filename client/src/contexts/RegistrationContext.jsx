import React, { createContext, useContext, useState, useEffect } from 'react';

const RegistrationContext = createContext();

export const useRegistration = () => {
    const context = useContext(RegistrationContext);
    if (!context) {
        throw new Error('useRegistration debe usarse dentro de RegistrationProvider');
    }
    return context;
};

export const RegistrationProvider = ({ children }) => {
    const [alumnoData, setAlumnoData] = useState(null);
    const [tutorData, setTutorData] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [isCompleted, setIsCompleted] = useState(false);
    const [tutorExistente, setTutorExistente] = useState(true);

    // ✅ RECUPERAR ESTADO COMPLETO AL RECARGAR
    useEffect(() => {
        const savedAlumnoData = localStorage.getItem('registration_alumnoData');
        const savedTutorData = localStorage.getItem('registration_tutorData');
        const savedCurrentStep = localStorage.getItem('registration_currentStep');
        const savedTutorExistente = localStorage.getItem('registration_tutorExistente');
        
        if (savedAlumnoData) {
            setAlumnoData(JSON.parse(savedAlumnoData));
        }
        if (savedTutorData) {
            setTutorData(JSON.parse(savedTutorData));
        }
        if (savedCurrentStep) {
            setCurrentStep(parseInt(savedCurrentStep));
        }
        if (savedTutorExistente) {
            setTutorExistente(JSON.parse(savedTutorExistente));
        }
    }, []);

    // ✅ GUARDAR ESTADO COMPLETO EN LOCALSTORAGE
    useEffect(() => {
        if (alumnoData) {
            localStorage.setItem('registration_alumnoData', JSON.stringify(alumnoData));
        } else {
            localStorage.removeItem('registration_alumnoData');
        }
        
        if (tutorData) {
            localStorage.setItem('registration_tutorData', JSON.stringify(tutorData));
        } else {
            localStorage.removeItem('registration_tutorData');
        }
        
        localStorage.setItem('registration_currentStep', currentStep.toString());
        localStorage.setItem('registration_tutorExistente', JSON.stringify(tutorExistente));
    }, [alumnoData, tutorData, currentStep, tutorExistente]);

    const resetRegistration = () => {
        setAlumnoData(null);
        setTutorData(null);
        setCurrentStep(1);
        setIsCompleted(false);
        setTutorExistente(true);
        
        // ✅ LIMPIAR TODO EL LOCALSTORAGE
        localStorage.removeItem('registration_alumnoData');
        localStorage.removeItem('registration_tutorData');
        localStorage.removeItem('registration_currentStep');
        localStorage.removeItem('registration_tutorExistente');
        
        console.log('🔄 Estado de registro reiniciado completamente (alumno + tutor)');
    };

    const setAlumnoDataAndProceed = (data) => {
        setAlumnoData(data);
        setCurrentStep(2);
        setIsCompleted(false);
        console.log('✅ Datos del alumno guardados, avanzando al paso 2');
    };

    // ✅ NUEVA FUNCIÓN PARA GUARDAR DATOS DEL TUTOR
    const setTutorDataAndProceed = (data, esExistente = true) => {
        setTutorData(data);
        setTutorExistente(esExistente);
        console.log('✅ Datos del tutor guardados en contexto');
    };

    // ✅ NUEVA FUNCIÓN PARA ACTUALIZAR TUTOR EXISTENTE
    const updateTutorExistente = (esExistente) => {
        setTutorExistente(esExistente);
        // Si cambia a tutor existente, limpiamos los datos de tutor nuevo
        if (esExistente) {
            setTutorData(null);
        }
    };

    const completeRegistration = () => {
        setIsCompleted(true);
        resetRegistration();
        console.log('🎉 Registro completado exitosamente (datos limpiados)');
    };

    const goToStep = (step) => {
        setCurrentStep(step);
        console.log(`↩️ Navegando al paso ${step} (datos mantenidos)`);
    };

    return (
        <RegistrationContext.Provider value={{
            alumnoData,
            tutorData,
            tutorExistente,
            currentStep,
            isCompleted,
            setAlumnoData: setAlumnoDataAndProceed,
            setTutorData: setTutorDataAndProceed,
            setTutorExistente: updateTutorExistente,
            resetRegistration,
            completeRegistration,
            goToStep,
            updateAlumnoData: setAlumnoData,
            updateTutorData: setTutorData
        }}>
            {children}
        </RegistrationContext.Provider>
    );
};