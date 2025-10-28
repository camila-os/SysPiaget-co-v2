// ✅ VALIDACIONES PARA SELECCIÓN DE ALUMNOS
export const validacionesAlumnos = {
  // Validar alumnos seleccionados
  validarAlumnosSeleccionados: (alumnos) => {
    if (!alumnos || alumnos.length === 0) {
      return "Debe seleccionar al menos un alumno";
    }
    
    if (alumnos.length > 5) {
      return "Máximo 5 alumnos por incidencia";
    }
    
    // Verificar que todos los alumnos estén activos
    const alumnosInactivos = alumnos.filter(alumno => alumno.estado_alumno !== 'Activo');
    if (alumnosInactivos.length > 0) {
      return `No se pueden seleccionar alumnos inactivos: ${alumnosInactivos.map(a => `${a.nombre_alumno} ${a.apellido_alumno}`).join(', ')}`;
    }
    
    return true;
  },

  // Validar filtro de texto
  validarFiltroTexto: (texto) => {
    if (texto && texto.length > 50) {
      return "Máximo 50 caracteres para la búsqueda";
    }
    
    // Validar que no contenga caracteres especiales peligrosos
    const regexPeligroso = /[<>{}[\]\\]/;
    if (regexPeligroso.test(texto)) {
      return "Caracteres no permitidos en la búsqueda";
    }
    
    return true;
  },

  // Validar que el alumno puede ser agregado
  validarAgregarAlumno: (alumno, alumnosSeleccionados) => {
    if (alumno.estado_alumno !== 'Activo') {
      return `No se puede seleccionar al alumno ${alumno.nombre_alumno} ${alumno.apellido_alumno} porque está inactivo`;
    }
    
    if (alumnosSeleccionados.length >= 10) {
      return 'Máximo 10 alumnos por incidencia';
    }
    
    if (alumnosSeleccionados.find(a => a.id_alumno === alumno.id_alumno)) {
      return 'El alumno ya está seleccionado';
    }
    
    return true;
  }
};

// ✅ VALIDACIONES PARA DETALLES DE INCIDENCIA
export const validacionesIncidencia = {
  // Validar tipo de medida
  validarTipoMedida: (valor) => {
    if (!valor) {
      return "Seleccione un tipo de medida";
    }
    
    if (!['1', '2'].includes(valor)) {
      return "Tipo de medida inválido";
    }
    
    return true;
  },

  // Validar tipo de incidencia
  validarTipoIncidencia: (valor) => {
    if (!valor) {
      return "Seleccione un tipo de incidencia";
    }
    
    if (isNaN(parseInt(valor))) {
      return "Tipo de incidencia inválido";
    }
    
    return true;
  },

  // Validar incidencia específica
  validarIncidenciaEspecifica: (valor, tipoIncidenciaSeleccionado) => {
    if (!valor) {
      return "Seleccione una incidencia específica";
    }
    
    if (isNaN(parseInt(valor))) {
      return "Incidencia específica inválida";
    }
    
    if (tipoIncidenciaSeleccionado && !valor) {
      return "Debe seleccionar una incidencia específica para el tipo elegido";
    }
    
    return true;
  },

  // Validar lugar
  validarLugar: (valor) => {
    if (!valor) {
      return "Seleccione un lugar";
    }
    
    if (isNaN(parseInt(valor))) {
      return "Lugar inválido";
    }
    
    return true;
  },

  // Validar días de suspensión
  validarDiasSuspension: (valor, tipoMedida) => {
    if (tipoMedida === "2") { // Solo validar si es suspensión
      if (!valor) {
        return "Ingrese los días de suspensión";
      }
      
      const dias = parseInt(valor);
      if (isNaN(dias) || dias < 1) {
        return "Los días de suspensión deben ser un número mayor a 0";
      }
      
      if (dias > 30) {
        return "Máximo 30 días de suspensión";
      }
    }
    
    return true;
  },

  // Validar formulario completo de incidencia
  validarFormularioCompleto: (data) => {
    const {
      tipo_medida,
      tipo_incidencia,
      incidencia,
      id_lugar,
      cantidad_dias,
      descripcion_caso
    } = data;

    // Validar campos requeridos
    const validaciones = [
      { campo: 'tipo_medida', valor: tipo_medida, validador: validacionesIncidencia.validarTipoMedida },
      { campo: 'tipo_incidencia', valor: tipo_incidencia, validador: validacionesIncidencia.validarTipoIncidencia },
      { campo: 'incidencia', valor: incidencia, validador: (v) => validacionesIncidencia.validarIncidenciaEspecifica(v, tipo_incidencia) },
      { campo: 'id_lugar', valor: id_lugar, validador: validacionesIncidencia.validarLugar },
      { campo: 'cantidad_dias', valor: cantidad_dias, validador: (v) => validacionesIncidencia.validarDiasSuspension(v, tipo_medida) },
      { campo: 'descripcion_caso', valor: descripcion_caso, validador: validacionesIncidencia.validarDescripcionCaso }
    ];

    for (const { campo, valor, validador } of validaciones) {
      const resultado = validador(valor);
      if (resultado !== true) {
        return { valido: false, campo, mensaje: resultado };
      }
    }

    return { valido: true };
  }
};

// ✅ FUNCIONES DE UTILIDAD COMUNES
export const utilidadesValidacion = {
  // Limitar caracteres en tiempo real
  limitarCaracteres: (e, maxLength) => {
    if (e.target.value.length > maxLength) {
      e.target.value = e.target.value.slice(0, maxLength);
    }
  },

  // Limpiar espacios en tiempo real
  limpiarEspacios: (e) => {
    e.target.value = e.target.value.replace(/\s{2,}/g, ' ');
  },

  // Validar que no sea solo espacios
  validarNoSoloEspacios: (valor) => {
    if (valor && valor.trim().length === 0) {
      return "No puede contener solo espacios";
    }
    return true;
  },

  // Formatear mensaje de error
  formatearError: (campo, mensaje) => ({
    campo,
    mensaje,
    timestamp: new Date().toISOString()
  }),

  // Limpiar errores del servidor
  limpiarErroresServidor: (setServerErrors) => {
    setServerErrors({});
  }
};

export default {
  validacionesAlumnos,
  validacionesIncidencia,
  utilidadesValidacion
};