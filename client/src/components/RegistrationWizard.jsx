// src/components/RegistrationWizard.jsx
import { useRegistration } from '../contexts/RegistrationContext';
import RegistrarAlumno from '../pages/secretarios/RegistrarAlumno';
import RegistrarTutor from '../pages/secretarios/RegistrarTutor';

const RegistrationWizard = () => {
  const { currentStep, isCompleted, resetRegistration } = useRegistration();

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Registro Completado!</h2>
          <p className="text-gray-600 mb-6">
            El alumno y tutor han sido registrados exitosamente.
          </p>
          <button
            onClick={resetRegistration}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
          >
            Registrar otro alumno
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentStep === 1 && <RegistrarAlumno />}
      {currentStep === 2 && <RegistrarTutor />}
    </div>
  );
};

export default RegistrationWizard;