import React from "react";
import logoIcon from "../style/logos_e_imagenes/icon-jp-v2.png";
import "../style/Perfil.css";
import UserMenu from "./UserMenu";

function Perfil() {
  return (
    <>
      {/* HEADER PRINCIPAL */}
      <header className="header-perf">
        {/* IZQUIERDA: Logo + texto */}
        <div className="logo-container">
          <div className="logo-perf">
            <img
              src={logoIcon}
              alt="Instituto Jean Piaget"
              className="logo-image"
            />
          </div>
          <div className="instituto-info">
            <span className="instituto">Instituto</span>
            <div className="jeanpiaget">
              Jean Piaget
              <span className="instituto-nro">N° 8048</span>
            </div>
          </div>
        </div>
        
        {/* DERECHA: UserMenu posicionado a la derecha extrema */}
        <div className="user-menu-container">
          <UserMenu />
        </div>
      </header>
    </>
  );
}

export default Perfil;