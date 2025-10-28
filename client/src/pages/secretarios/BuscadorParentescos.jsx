import React, { useState, useMemo } from 'react';
import "./BuscadorParentescos.css";

const BuscadorParentescos = ({ 
  parentescos = [], 
  onParentescoSelect, 
  disabled = false 
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [mostrarOpciones, setMostrarOpciones] = useState(false);

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