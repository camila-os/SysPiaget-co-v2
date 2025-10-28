import React, { useState, useRef, useEffect } from 'react';
import '../style/UserMenu.css';

const UserMenu = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const dropdownRef = useRef(null);

  // Cargar nombre del usuario desde localStorage al montar el componente
  useEffect(() => {
    const loadUserData = () => {
      const name = localStorage.getItem("employeeFullName");
      console.log('Nombre completo:', name);
      setFullName(name || "Usuario");
    };

    loadUserData();
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("rol");
    localStorage.removeItem("name");
    localStorage.removeItem("primer_login");
    localStorage.removeItem("employeeFullName");
    window.location.href = "/";
  };

  // Función para obtener la clase de color basada en la inicial
  const getAvatarColorClass = () => {
    if (!fullName) return '';
    const firstLetter = fullName.charAt(0).toLowerCase();
    return `color-${firstLetter}`;
  };

  return (
    <div className="user-menu" ref={dropdownRef}>
      <button 
        className="user-button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className={`user-avatar ${getAvatarColorClass()}`}>
          {fullName.charAt(0).toUpperCase()}
        </div>
        <span className="user-name">{fullName}</span>
        <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>
          ▼
        </span>
      </button>

      {isDropdownOpen && (
        <div className="dropdown-menu">
          <button 
            className="logout-button"
            onClick={handleLogout}
          >
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;