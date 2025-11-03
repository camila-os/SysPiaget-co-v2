// src/pages/secretarios/Secretario.jsx
import { useNavigate } from "react-router";
import Perfil from "../../components/Perfil";   
import "../../style/Secretario.css";

function HomeSecretarios() {
  const navigate = useNavigate();

  return (
    <div className="home-secretarios">
      <Perfil />

      <section className="hero">
        <div className="geometric-bg">
          <div className="geometric-shape shape1"></div>
          <div className="geometric-shape shape2"></div>
          <div className="geometric-shape shape3"></div>
          <div className="geometric-shape shape4"></div>
          <div className="geometric-shape shape5"></div>
          <div className="geometric-shape shape6"></div>
          <div className="geometric-shape shape7"></div>
          <div className="geometric-shape shape8"></div>
        </div>

        <div className="hero-content">
          <h2>Bienvenido Sistema de Gestión del Instituto Jean Piaget</h2>
          <p>Gestión integral de alumnos y tutores</p>
        </div>
      </section>

      <section className="opciones-secretario">
        <button
          onClick={() => navigate("/registrar-alumno-completo")} // ✅ NUEVA RUTA
          className="btn-opcion rojo"
        >
           Registrar Alumno Completo
        </button>
        <button
          onClick={() => navigate("/ListaAlumnos")}
          className="btn-opcion azul"
        >
           Lista de Alumnos
        </button>
        <button
          onClick={() => navigate("/registrar-tutor")}
          className="btn-opcion verde"
        >
           Registrar Tutor Independiente
        </button>
        <button
          onClick={() => navigate("/ListaTutores")}
          className="btn-opcion naranja"
        >
           Lista de Tutores
        </button>
      </section>
    </div>
  );
}

export default HomeSecretarios;