// src/validations/colegioValidations.jsx

// Validar nombre del colegio
export const validarNombreColegio = (nombre, colegiosExistentes = []) => {
  const nombreTrimmed = nombre.trim();
  
  // Validar que no esté vacío
  if (!nombreTrimmed) {
    return 'El nombre del colegio es requerido';
  }

  // Validar longitud mínima
  if (nombreTrimmed.length < 3) {
    return 'El nombre debe tener al menos 3 caracteres';
  }

  // Validar longitud máxima
  if (nombreTrimmed.length > 150) {
    return 'El nombre no puede exceder 150 caracteres';
  }

  // Validar caracteres permitidos (letras, números, espacios, acentos, puntuación básica)
  // NOTA: Usamos una validación manual en lugar de regex compleja para evitar problemas
  const caracteresPermitidos = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZáéíóúÁÉÍÓÚñÑ0123456789 .,-()&";
  
  for (let char of nombreTrimmed) {
    if (!caracteresPermitidos.includes(char)) {
      return `Carácter no permitido: "${char}". Solo se permiten letras, números, espacios y los siguientes caracteres: . , - ( ) &`;
    }
  }

  // Validar que no tenga espacios múltiples consecutivos
  if (/\s{2,}/.test(nombre)) {
    return 'No se permiten espacios múltiples consecutivos';
  }

  // Validar que no empiece ni termine con espacio
  if (nombre !== nombreTrimmed) {
    return 'El nombre no puede empezar ni terminar con espacios';
  }

  // Validar que no sea duplicado (comparación normalizada)
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

  const nombreNormalizado = normalizarTexto(nombreTrimmed);
  const colegioExistente = colegiosExistentes.find(colegio => 
    normalizarTexto(colegio.nombre_colegio_procedencia) === nombreNormalizado
  );
  
  if (colegioExistente) {
    return `Ya existe un colegio con este nombre: "${colegioExistente.nombre_colegio_procedencia}"`;
  }

  return null; // Válido
};

// Validar número de colegio
export const validarNumeroColegio = (numero, colegiosExistentes = []) => {
  // Si está vacío, es válido (campo opcional)
  if (!numero || numero.toString().trim() === '') {
    return null;
  }

  const numeroStr = numero.toString().trim();
  
  // Validar que sea numérico
  if (!/^\d+$/.test(numeroStr)) {
    return 'El número de colegio debe contener solo dígitos numéricos';
  }

  // Validar que no empiece con cero (a menos que sea 0, pero eso no debería pasar)
  if (numeroStr.length > 1 && numeroStr.startsWith('0')) {
    return 'El número de colegio no puede empezar con cero';
  }

  // Validar longitud máxima (5 cifras)
  if (numeroStr.length > 5) {
    return 'El número de colegio no puede tener más de 5 cifras';
  }

  // Convertir a número para validaciones numéricas
  const numeroInt = parseInt(numeroStr, 10);

  // Validar rango numérico
  if (numeroInt < 1) {
    return 'El número de colegio debe ser mayor a 0';
  }

  if (numeroInt > 99999) {
    return 'El número de colegio no puede ser mayor a 99999';
  }

  // Validar que no esté duplicado
  const numeroExistente = colegiosExistentes.find(colegio => 
    colegio.nro_colegio_procedencia && colegio.nro_colegio_procedencia.toString() === numeroStr
  );
  
  if (numeroExistente) {
    return `Ya existe un colegio con este número: "${numeroExistente.nro_colegio_procedencia} - ${numeroExistente.nombre_colegio_procedencia}"`;
  }

  return null; // Válido
};

// Validación completa del formulario
export const validarFormularioCompleto = (formData, colegiosExistentes = []) => {
  const { nombre_colegio_procedencia, nro_colegio_procedencia } = formData;

  // Validar nombre
  const errorNombre = validarNombreColegio(nombre_colegio_procedencia, colegiosExistentes);
  if (errorNombre) {
    return errorNombre;
  }

  // Validar número (si se proporciona)
  const errorNumero = validarNumeroColegio(nro_colegio_procedencia, colegiosExistentes);
  if (errorNumero) {
    return errorNumero;
  }

  return null; // Formulario válido
};

// Props para inputs (SIMPLIFICADOS - sin pattern problemático)
export const nombreColegioInputProps = {
  minLength: 3,
  maxLength: 150,
  title: "Mínimo 3 caracteres, máximo 150. Solo letras, números, espacios y . , - ( ) &"
};

export const numeroColegioInputProps = {
  min: 1,
  max: 99999,
  title: "Número entre 1 y 99999 (máximo 5 cifras, no puede empezar con 0)"
};