import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import "../../style/DirectorPage.css";
import Perfil from "../../components/Perfil";

function DirectorPage() {
  const [empleados, setEmpleados] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingDni, setEditingDni] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
    trigger
  } = useForm({
    mode: "onChange",
    defaultValues: {
      dni_empleado: "",
      nombre_empleado: "",
      apellido_empleado: "",
      telefono_empleado: "",
      correo_empleado: "",
      genero_empleado: "M",
      id_rol: "",
      estado_empleado: "Activo",
    }
  });

  const token = localStorage.getItem("token");

  // Observar los campos para mostrar contadores en tiempo real
  const watchedFields = watch();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    window.location.href = "/";
  };

  const fetchEmpleados = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/login/empleados/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        setError("No tienes permisos para acceder a empleados");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setEmpleados(data);
      setLoading(false);
    } catch (err) {
      setError("Error al cargar empleados: " + err.message);
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/login/roles/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      setError("Error al cargar roles: " + err.message);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchEmpleados();
  }, []);

  // Función auxiliar para determinar clases de campo
  const getFieldClassName = (fieldName) => {
    let className = "input-field";
    if (errors[fieldName]) {
      className += " error";
    } else if (watchedFields[fieldName] && watchedFields[fieldName].length > 0 && !errors[fieldName]) {
      // Solo mostrar éxito si el campo tiene valor y no tiene errores
      if (fieldName === "dni_empleado" && watchedFields[fieldName].length === 8) {
        className += " success";
      } else if ((fieldName === "nombre_empleado" || fieldName === "apellido_empleado") && watchedFields[fieldName].length >= 2) {
        className += " success";
      } else if (fieldName === "telefono_empleado" && watchedFields[fieldName].length >= 10) {
        className += " success";
      } else if (fieldName === "correo_empleado" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchedFields[fieldName])) {
        className += " success";
      } else if (fieldName === "id_rol" && watchedFields[fieldName]) {
        className += " success";
      }
    }
    return className;
  };

  const getSelectClassName = (fieldName) => {
    let className = "select-field";
    if (watchedFields[fieldName] && !errors[fieldName]) {
      className += " success";
    }
    return className;
  };

  const getCounterClassName = (fieldName) => {
    let className = "counter";
    if (errors[fieldName]) {
      className += " error";
    } else if (watchedFields[fieldName] && watchedFields[fieldName].length > 0 && !errors[fieldName]) {
      // Lógica similar a getFieldClassName para mostrar éxito
      if (fieldName === "dni_empleado" && watchedFields[fieldName].length === 8) {
        className += " success";
      } else if ((fieldName === "nombre_empleado" || fieldName === "apellido_empleado") && watchedFields[fieldName].length >= 2) {
        className += " success";
      } else if (fieldName === "telefono_empleado" && watchedFields[fieldName].length >= 10) {
        className += " success";
      } else if (fieldName === "correo_empleado" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchedFields[fieldName])) {
        className += " success";
      } else {
        className += " active";
      }
    } else {
      className += " normal";
    }
    return className;
  };

  const onCreate = async (data) => {
    try {
      const res = await fetch("http://localhost:8000/api/login/empleados/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || errorData.detail || "Error al registrar empleado");
      }
      
      const newEmpleado = await res.json();
      setEmpleados([...empleados, newEmpleado]);
      
      setError("");
      setTimeout(() => {
        alert("Empleado registrado exitosamente!");
      }, 100);
      
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const onUpdate = async (data) => {
    try {
      const res = await fetch(
        `http://localhost:8000/api/login/empleados/${editingDni}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data)
        }
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || errorData.detail || "Error al actualizar empleado");
      }

      await fetchEmpleados();
      
      setError("");
      setTimeout(() => {
        alert("Empleado actualizado exitosamente!");
      }, 100);
      
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (emp) => {
    setEditingDni(emp.dni_empleado);
    // Establecer valores usando setValue de react-hook-form
    Object.keys(emp).forEach(key => {
      if (emp[key] !== null && emp[key] !== undefined) {
        setValue(key, emp[key]);
      }
    });
  };

  const handleDelete = async (dni) => {
    if (!window.confirm("¿Seguro que querés eliminar este empleado?")) return;
    try {
      const res = await fetch(
        `http://localhost:8000/api/login/empleados/${dni}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al eliminar empleado");
      }
      
      setEmpleados(empleados.filter((emp) => emp.dni_empleado !== dni));
      
      setTimeout(() => {
        alert("Empleado eliminado exitosamente!");
      }, 100);
      
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setEditingDni(null);
    reset({
      dni_empleado: "",
      nombre_empleado: "",
      apellido_empleado: "",
      telefono_empleado: "",
      correo_empleado: "",
      genero_empleado: "M",
      id_rol: "",
      estado_empleado: "Activo",
    });
    setError("");
  };

  return (
    <div className="director-page">
      <Perfil />
      
      <div className="director-content">
        <div className="content-header">
          <h1 className="page-title">Gestión de Empleados</h1>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {loading ? (
          <p className="loading-text">Cargando empleados...</p>
        ) : (
          <div className="director-layout">
            <div className="form-container">
              <h2>
                {editingDni ? "Editar Empleado" : "Registrar Nuevo Empleado"}
              </h2>
              
              <form onSubmit={handleSubmit(editingDni ? onUpdate : onCreate)} className="form-grid">
                {/* DNI */}
                <div className="form-group">
                  <label className="form-label">
                    DNI *
                  </label>
                  <input
                    type="text"
                    placeholder="Ingrese 8 dígitos"
                    disabled={!!editingDni}
                    className={getFieldClassName("dni_empleado")}
                    {...register("dni_empleado", {
                      required: "DNI es obligatorio",
                      pattern: {
                        value: /^\d{8}$/,
                        message: "Debe tener exactamente 8 dígitos"
                      },
                      onChange: (e) => {
                        // Limitar a solo números y máximo 8 dígitos
                        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
                        setValue("dni_empleado", value);
                        trigger("dni_empleado");
                      }
                    })}
                  />
                  <div className={getCounterClassName("dni_empleado")}>
                    {watchedFields.dni_empleado?.length || 0}/8 dígitos
                    {watchedFields.dni_empleado?.length === 8 && !errors.dni_empleado && " "}
                  </div>
                  {errors.dni_empleado && (
                    <p className="error-message">
                      {errors.dni_empleado.message}
                    </p>
                  )}
                </div>

                {/* Nombre */}
                <div className="form-group">
                  <label className="form-label">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    placeholder="Ingrese nombre"
                    className={getFieldClassName("nombre_empleado")}
                    {...register("nombre_empleado", {
                      required: "Nombre es obligatorio",
                      minLength: {
                        value: 2,
                        message: "Mínimo 2 caracteres"
                      },
                      maxLength: {
                        value: 35,
                        message: "Máximo 35 caracteres"
                      },
                      pattern: {
                        value: /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/,
                        message: "No se permiten números"
                      },
                      onChange: (e) => {
                        const value = e.target.value.slice(0, 35);
                        setValue("nombre_empleado", value);
                        trigger("nombre_empleado");
                      }
                    })}
                  />
                  <div className={getCounterClassName("nombre_empleado")}>
                    {watchedFields.nombre_empleado?.length || 0}/35 caracteres
                    {watchedFields.nombre_empleado?.length >= 2 && !errors.nombre_empleado && " "}
                  </div>
                  {errors.nombre_empleado && (
                    <p className="error-message">
                      {errors.nombre_empleado.message}
                    </p>
                  )}
                </div>

                {/* Apellido */}
                <div className="form-group">
                  <label className="form-label">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    placeholder="Ingrese apellido"
                    className={getFieldClassName("apellido_empleado")}
                    {...register("apellido_empleado", {
                      required: "Apellido es obligatorio",
                      minLength: {
                        value: 2,
                        message: "Mínimo 2 caracteres"
                      },
                      maxLength: {
                        value: 35,
                        message: "Máximo 35 caracteres"
                      },
                      pattern: {
                        value: /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/,
                        message: "No se permiten números"
                      },
                      onChange: (e) => {
                        const value = e.target.value.slice(0, 35);
                        setValue("apellido_empleado", value);
                        trigger("apellido_empleado");
                      }
                    })}
                  />
                  <div className={getCounterClassName("apellido_empleado")}>
                    {watchedFields.apellido_empleado?.length || 0}/35 caracteres
                    {watchedFields.apellido_empleado?.length >= 2 && !errors.apellido_empleado && " "}
                  </div>
                  {errors.apellido_empleado && (
                    <p className="error-message">
                      {errors.apellido_empleado.message}
                    </p>
                  )}
                </div>

                {/* Teléfono */}
                <div className="form-group">
                  <label className="form-label">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="Ingrese teléfono"
                    className={getFieldClassName("telefono_empleado")}
                    {...register("telefono_empleado", {
                      pattern: {
                        value: /^\d*$/,
                        message: "Solo números permitidos"
                      },
                      minLength: {
                        value: 10,
                        message: "Mínimo 10 dígitos"
                      },
                      maxLength: {
                        value: 13,
                        message: "Máximo 13 dígitos"
                      },
                      onChange: (e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 13);
                        setValue("telefono_empleado", value);
                        trigger("telefono_empleado");
                      }
                    })}
                  />
                  <div className={getCounterClassName("telefono_empleado")}>
                    {watchedFields.telefono_empleado?.length || 0}/13 dígitos
                    {watchedFields.telefono_empleado?.length >= 10 && !errors.telefono_empleado && " "}
                  </div>
                  {errors.telefono_empleado && (
                    <p className="error-message">
                      {errors.telefono_empleado.message}
                    </p>
                  )}
                </div>

                {/* Correo */}
                <div className="form-group">
                  <label className="form-label">
                    Correo
                  </label>
                  <input
                    type="email"
                    placeholder="Ingrese correo"
                    className={getFieldClassName("correo_empleado")}
                    {...register("correo_empleado", {
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Correo inválido"
                      },
                      maxLength: {
                        value: 45,
                        message: "Máximo 45 caracteres"
                      },
                      onChange: (e) => {
                        const value = e.target.value.slice(0, 45);
                        setValue("correo_empleado", value);
                        trigger("correo_empleado");
                      }
                    })}
                  />
                  <div className={getCounterClassName("correo_empleado")}>
                    {watchedFields.correo_empleado?.length || 0}/45 caracteres
                    {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchedFields.correo_empleado) && !errors.correo_empleado && " "}
                  </div>
                  {errors.correo_empleado && (
                    <p className="error-message">
                      {errors.correo_empleado.message}
                    </p>
                  )}
                </div>

                {/* Género */}
                <div className="form-group">
                  <label className="form-label">
                    Género
                  </label>
                  <select 
                    className="select-field"
                    {...register("genero_empleado")}
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>

                {/* Rol */}
                <div className="form-group">
                  <label className="form-label">
                    Rol *
                  </label>
                  <select 
                    required
                    className={getSelectClassName("id_rol")}
                    {...register("id_rol", {
                      required: "Rol es obligatorio"
                    })}
                  >
                    <option value="">Seleccionar rol</option>
                    {roles.map((rol) => (
                      <option key={rol.id_rol} value={rol.id_rol}>
                        {rol.nombre_rol}
                      </option>
                    ))}
                  </select>
                  {watchedFields.id_rol && !errors.id_rol && (
                    <div className="success-message">
                       Rol seleccionado
                    </div>
                  )}
                  {errors.id_rol && (
                    <p className="error-message">
                      {errors.id_rol.message}
                    </p>
                  )}
                </div>

                {/* Estado (solo visible al editar) */}
                {editingDni && (
                  <div className="form-group">
                    <label className="form-label">
                      Estado
                    </label>
                    <select
                      className="select-field"
                      {...register("estado_empleado")}
                    >
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                )}

                {/* Botones */}
                <div className="buttons-container">
                  <button 
                    type="submit"
                    className="btn btn-primary"
                  >
                    {editingDni ? "Guardar Cambios" : "Registrar Empleado"}
                  </button>
                  {editingDni && (
                    <button 
                      type="button" 
                      onClick={resetForm}
                      className="btn btn-secondary"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Tabla a la derecha */}
            <div className="table-section">
              <h2>Lista de Empleados ({empleados.length})</h2>
              {empleados.length === 0 ? (
                <p className="text-center text-muted">No hay empleados registrados</p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr className="table-header">
                        <th>DNI</th>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th className="table-cell-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empleados.map((emp) => (
                        <tr key={emp.dni_empleado} className="table-row">
                          <td className="table-cell">{emp.dni_empleado}</td>
                          <td className="table-cell">{emp.nombre_empleado}</td>
                          <td className="table-cell">{emp.apellido_empleado}</td>
                          <td className="table-cell">{emp.rol_nombre}</td>
                          <td className="table-cell">
                            <span className={`status-badge ${emp.estado_empleado === 'Activo' ? 'status-active' : 'status-inactive'}`}>
                              {emp.estado_empleado}
                            </span>
                          </td>
                          <td className="table-cell table-cell-center">
                            <button 
                              onClick={() => handleEdit(emp)}
                              className="btn-action btn-edit"
                            >
                              Editar
                            </button>
                            <button 
                              onClick={() => handleDelete(emp.dni_empleado)}
                              className="btn-action btn-delete"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DirectorPage;