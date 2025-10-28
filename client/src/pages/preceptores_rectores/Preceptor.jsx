import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import Perfil from "../../components/Perfil";
import "../../style/Secretario.css";

function HomePreceptoresRectores() {
  const navigate = useNavigate();

  return (
    <div className="home-secretario">
      <Perfil />

      <section className="hero">
        <div className="geometric-bg">
          <div className="geometric-shape shape1"></div>
          <div className="geometric-shape shape2"></div>
          <div className="geometric-shape shape3"></div>
          <div className="geometric-shape shape4"></div>
        </div>

        <div className="hero-content">
          <h2>Bienvenido Sistema de Gestión del Instituto Jean Piaget</h2>
          <p>Gestión de medidas disciplinarias, actividades extracurriculares y reuniones</p>
        </div>
      </section>

      <section className="opciones-secretario">
        <button
          onClick={() => navigate("/preceptor_rector/SeleccionAlumnos")}
          className="btn-opcion rojo"
        >
          Registrar Incidencia
        </button>
        <button
          onClick={() => navigate("/preceptor_rector/ListaIncidencias")}
          className="btn-opcion azul"
        >
          Lista de Incidencias
        </button>
        <button
          onClick={() => navigate()}
          className="btn-opcion verde"
        >
          Crear opción de incidencia
        </button>
      </section>
    </div>
  );
}

export default HomePreceptoresRectores;