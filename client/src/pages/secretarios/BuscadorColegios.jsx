import React, { useState, useRef, useEffect } from 'react';
import './BuscadorColegios.css';

const normalizarTexto = (texto) => {
  if (!texto) return '';
  return texto
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const BuscadorColegios = ({ 
  colegios, 
  onColegioSelect, 
  disabled = false,
  valorSeleccionado = null  // ← NUEVA PROP para recibir el ID seleccionado
}) => {
  const [filtro, setFiltro] = useState('');
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // ✅ NUEVO EFFECT: Actualizar el input cuando cambia el valorSeleccionado
  useEffect(() => {
    if (valorSeleccionado) {
      const colegioSeleccionado = colegios.find(c => c.id === valorSeleccionado);
      if (colegioSeleccionado) {
        setFiltro(colegioSeleccionado.nombre_colegio_procedencia);
      }
    } else {
      setFiltro(''); // Limpiar si no hay selección
    }
  }, [valorSeleccionado, colegios]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMostrarDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Manejar cambio en el input
  const handleInputChange = (e) => {
    let valor = e.target.value;
    valor = valor.replace(/\s+/g, ' ');
    setFiltro(valor);
    setMostrarDropdown(valor.length > 0);
    
    if (valor === '') {
      onColegioSelect(null);
    }
  };

  // Prevenir espacios múltiples
  const handleKeyDown = (e) => {
    if (e.key === ' ' && filtro.endsWith(' ')) {
      e.preventDefault();
    }
  };

  // Filtrar colegios
  const colegiosFiltrados = colegios.filter(colegio => {
    if (!filtro.trim()) return false;

    const terminoNormalizado = normalizarTexto(filtro);
    const nombreNormalizado = normalizarTexto(colegio.nombre_colegio_procedencia);
    const numero = colegio.nro_colegio_procedencia?.toString() || '';

    // Búsqueda por número exacto o parcial
    if (numero.includes(filtro.trim())) return true;
    if (terminoNormalizado.length === 0) return false;

    const palabras = terminoNormalizado.split(' ');
    return palabras.every(palabra => nombreNormalizado.includes(palabra));
  });

  // Manejar selección de colegio existente
  const handleSeleccionarColegio = (colegio) => {
    setFiltro(colegio.nombre_colegio_procedencia);
    setMostrarDropdown(false);
    onColegioSelect(colegio.id);
  };

  return (
    <div className="buscador-colegios" ref={dropdownRef}>
      <div className="buscador-input-container">
        <input
          type="text"
          value={filtro}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setMostrarDropdown(true)}
          placeholder="Buscar por nombre o número de colegio..."
          disabled={disabled}
          className="buscador-input"
        />
        {filtro && (
          <button
            type="button"
            onClick={() => { setFiltro(''); onColegioSelect(null); }}
            className="buscador-limpiar"
            disabled={disabled}
          >
            ×
          </button>
        )}
      </div>

      {mostrarDropdown && (
        <div className="dropdown-colegios">
          {colegiosFiltrados.length > 0 ? (
            colegiosFiltrados.slice(0, 10).map(colegio => (
              <div
                key={colegio.id}
                className="dropdown-item"
                onClick={() => handleSeleccionarColegio(colegio)}
              >
                <span className="colegio-numero">
                  {colegio.nro_colegio_procedencia || 'S/N'}
                </span>
                <span className="colegio-nombre">{colegio.nombre_colegio_procedencia}</span>
              </div>
            ))
          ) : (
            <div className="dropdown-no-results">
              No se encontraron colegios con "{filtro}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BuscadorColegios;