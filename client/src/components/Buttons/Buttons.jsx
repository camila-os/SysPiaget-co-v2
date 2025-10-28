import React from 'react';
import "../../style/Buttons/Buttons.css"; // CSS importado aquí


const ICONS = {
  cancel: (
    <svg className="icon" viewBox="0 0 24 24">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  ),
  edit: (
    <svg className="icon" viewBox="0 0 24 24">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
    </svg>
  ),
  next: (
    <svg className="icon" viewBox="0 0 24 24">
      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
    </svg>
  ),
  delete: (
    <svg className="icon" viewBox="0 0 24 24">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>
  ),
  home: (
    <svg className="icon" viewBox="0 0 24 24">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  ),
  back: (
    <svg className="icon" viewBox="0 0 24 24">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
    </svg>
  ),
};

const Button = ({
  type = 'solid',           // tipo de estilo (solid/outline/ghost)
  variant = 'cancel',       // variante (cancel/edit/next/etc)
  size = 'medium',          // tamaño
  buttonType = 'button',    // ← NUEVO: tipo HTML (button/submit/reset)
  children,
  disabled = false,
  onClick,
  className = '',
}) => {
  const classes = `btn btn-${variant} btn-${type} btn-${size} ${className}`;

  return (
    <button 
      type={buttonType}     // ← USAR el tipo HTML aquí
      className={classes} 
      disabled={disabled} 
      onClick={onClick}
    >
      {ICONS[variant]}
      {size !== 'square' && <span className="button-text">{children}</span>}
    </button>
  );
};

export default Button;
