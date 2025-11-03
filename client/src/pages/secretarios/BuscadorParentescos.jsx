import React, { useState, useMemo, useEffect } from 'react';
import "./BuscadorParentescos.css";

const BuscadorParentescos = ({ 
  parentescos = [], 
  onParentescoSelect, 
  disabled = false,
  valorSeleccionado = null // ✅ NUEVA PROP para recibir el ID seleccionado
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [mostrarOpciones, setMostrarOpciones] = useState(false);

  // ✅ NUEVO: Cargar el parentesco seleccionado cuando cambie la prop
  useEffect(() => {
    if (valorSeleccionado) {
      const parentescoSeleccionado = parentescos.find(p => p.id_parentesco === valorSeleccionado);
      if (parentescoSeleccionado) {
        setBusqueda(parentescoSeleccionado.parentesco_nombre);
      }
    } else {
      setBusqueda(''); // Limpiar si no hay selección
    }
  }, [valorSeleccionado, parentescos]);

  const parentescosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return parentescos;
    
    return parentescos.filter(parentesco =>
      parentesco.parentesco_nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [parentescos, busqueda]);

  const handleSelectParentesco = (parentesco) => {
    onParentescoSelect(parentesco.id_parentesco);
    setBusqueda(parentesco.parentesco_nombre);
    setMostrarOpciones(false);
  };

  const handleInputChange = (e) => {
    setBusqueda(e.target.value);
    setMostrarOpciones(true);
    
    // ✅ Limpiar selección si el usuario borra la búsqueda
    if (e.target.value === '') {
      onParentescoSelect(null);
    }
  };

  const handleInputFocus = () => {
    setMostrarOpciones(true);
  };

  const handleInputBlur = () => {
    setTimeout(() => setMostrarOpciones(false), 200);
  };

  return (
    <div className="buscador-parentescos">
      <input
        type="text"
        value={busqueda}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder="Buscar parentesco..."
        disabled={disabled}
        className="buscador-input"
      />
      
      {mostrarOpciones && parentescosFiltrados.length > 0 && (
        <div className="opciones-parentesco">
          {parentescosFiltrados.map((parentesco) => (
            <div
              key={parentesco.id_parentesco}
              className="opcion-parentesco"
              onClick={() => handleSelectParentesco(parentesco)}
            >
              {parentesco.parentesco_nombre}
            </div>
          ))}
        </div>
      )}
      
      {mostrarOpciones && busqueda && parentescosFiltrados.length === 0 && (
        <div className="sin-resultados">
          No se encontraron parentescos
        </div>
      )}
    </div>
  );
};

export default BuscadorParentescos;