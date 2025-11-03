import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { initializeAuth } from './api/auth.api';
import { RegistrationProvider } from "./contexts/RegistrationContext";
import { IncidenciaProvider } from "./contexts/IncidenciaContext";

// Importar componentes de rutas
import PublicRoute from "./components/PublicRoute";
import PrivateRouter from "./components/PrivateRouter";
import FirstLoginRoute from "./components/FirstLoginRoute";

// Importar páginas
import Login from "./pages/Login";
import DirectorPage from "./pages/directores/DirectorPage";
import FirstLoginPassword from "./pages/FirstLoginPassword";
import AccessDenied from "./pages/AccessDenied";

// Importar páginas de secretario
import HomeSecretarios from "./pages/secretarios/Secretario";
import RegistrarAlumno from './pages/secretarios/RegistrarAlumno';
import AlumnoListCards from './pages/secretarios/AlumnoListCards';
import TutorListCards from './pages/secretarios/TutorListCards';
import ModificarTutor from './pages/secretarios/ModificarTutor';
import RegistrarTutor from './pages/secretarios/RegistrarTutor';
import RegistrarTutorIndependiente from './pages/secretarios/RegistrarTutorIndependiente';
import ModificarAlumno from './pages/secretarios/ModificarAlumno';
import DetalleTutor from "./pages/secretarios/DetalleTutor";
import VincularTutorAlumno from './pages/secretarios/VincularTutorAlumno';

// 🆕 IMPORTAR EL NUEVO COMPONENTE
import RegistrationWizard from "./components/RegistrationWizard";

// Importar otras páginas
import Tutor from "./pages/tutor/tutor";
import Profesor from "./pages/profesor/profesor";
import Footer from "./components/Footer";

// Importar CSS del footer globalmente
import "./style/Footer.css";

// Importar páginas de preceptor y rector
import Preceptor from "./pages/preceptores_rectores/Preceptor";
import SeleccionAlumnos from './pages/preceptores_rectores/SeleccionAlumnos';
import DetallesIncidencia from './pages/preceptores_rectores/DetallesIncidencia';
import ResumenIncidencia from "./pages/preceptores_rectores/ResumenIncidencia";

function App() {
  useEffect(() => {
    console.log('🚀 Aplicación montada - inicializando autenticación...');
    initializeAuth();
  }, []);

  return (
    <AuthProvider>
      <RegistrationProvider>
        <IncidenciaProvider>
          <Router>
            <div className="app-container">
              <div className="app-content">
                <Routes>
                  {/* Ruta pública - Login */}
                  <Route
                    path="/"
                    element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    }
                  />
                  
                  {/* Ruta para cambio de contraseña en primer login */}
                  <Route
                    path="/first-login-password"
                    element={
                      <FirstLoginRoute>
                        <FirstLoginPassword />
                      </FirstLoginRoute>
                    }
                  />
                  
                  {/* Ruta para acceso denegado */}
                  <Route path="/access-denied" element={<AccessDenied />} />

                  {/* Rutas de SECRETARIO */}
                  <Route
                    path="/secretario"
                    element={
                      <PrivateRouter role="secretario">
                        <HomeSecretarios />
                      </PrivateRouter>
                    }
                  />
                  <Route
                    path="/ListaAlumnos"
                    element={
                      <PrivateRouter role="secretario">
                        <AlumnoListCards />
                      </PrivateRouter>
                    }
                  />
                  <Route
                    path="/ListaTutores"
                    element={
                      <PrivateRouter role="secretario">
                        <TutorListCards />
                      </PrivateRouter>
                    }
                  />
                  <Route
                    path="/DetalleTutor/:id_tutor"
                    element={
                      <PrivateRouter role="secretario">
                        <DetalleTutor />
                      </PrivateRouter>
                    }
                  />
                  <Route
                    path="/ModificarTutor/:id_tutor"
                    element={
                      <PrivateRouter role="secretario">
                        <ModificarTutor />
                      </PrivateRouter>
                    }
                  />
                  <Route
                    path="/ModificarAlumno/:dni_alumno"
                    element={
                      <PrivateRouter role="secretario">
                        <ModificarAlumno />
                      </PrivateRouter>
                    }
                  />
                  <Route
                    path="/crear-alumno"
                    element={
                      <PrivateRouter role="secretario">
                        <RegistrarAlumno />
                      </PrivateRouter>
                    }
                  />
                  <Route
                    path="/registrar-tutor-alumno"
                    element={
                      <PrivateRouter role="secretario">
                        <RegistrarTutor />
                      </PrivateRouter>
                    }
                  />
                  <Route
                    path="/registrar-tutor"
                    element={
                      <PrivateRouter role="secretario">
                        <RegistrarTutorIndependiente />
                      </PrivateRouter>
                    }
                  />
                  <Route
                    path="/VincularTutorAlumno/:dni_alumno"
                    element={
                      <PrivateRouter role="secretario">
                        <VincularTutorAlumno />
                      </PrivateRouter>
                    }
                  />

                  {/* 🆕 NUEVA RUTA PARA EL PROCESO COMPLETO */}
                  <Route
                    path="/registrar-alumno-completo"
                    element={
                      <PrivateRouter role="secretario">
                        <RegistrationWizard />
                      </PrivateRouter>
                    }
                  />

                  {/* Rutas de DIRECTOR */}
                  <Route
                    path="/director"
                    element={
                      <PrivateRouter role="director">
                        <DirectorPage />
                      </PrivateRouter>
                    }
                  />

                  {/* Rutas de TUTOR */}
                  <Route
                    path="/tutor"
                    element={
                      <PrivateRouter role="tutor">
                        <Tutor />
                      </PrivateRouter>
                    }
                  />

                  {/* Rutas de PROFESOR */}
                  <Route
                    path="/profesor"
                    element={
                      <PrivateRouter role="profesor">
                        <Profesor />
                      </PrivateRouter>
                    }
                  />

                  {/* Rutas de PRECEPTOR Y RECTOR */}
                  <Route
                    path="/preceptor_rector"
                    element={
                      <PrivateRouter role="preceptor_rector">
                        <Preceptor />
                      </PrivateRouter>
                    }
                  />
                  <Route
                    path="/preceptor_rector/SeleccionAlumnos"
                    element={
                      <PrivateRouter role="preceptor_rector">
                        <SeleccionAlumnos />
                      </PrivateRouter>
                    }
                  />
                  <Route
                    path="/preceptor_rector/DetallesIncidencia"
                    element={
                      <PrivateRouter role="preceptor_rector">
                        <DetallesIncidencia />
                      </PrivateRouter>
                    }
                  />
                  <Route
                    path="/preceptor_rector/ResumenIncidencia"
                    element={
                      <PrivateRouter role="preceptor_rector">
                        <ResumenIncidencia />
                      </PrivateRouter>
                    }
                  />

                  {/* Ruta para páginas no encontradas */}
                  <Route path="*" element={<div>Página no encontrada</div>} />
                </Routes>
              </div>
              
              <Footer />
            </div>
          </Router>
        </IncidenciaProvider>
      </RegistrationProvider>
    </AuthProvider>
  );
}

export default App;