import axios from "axios";

const empleadosApi = axios.create({
  baseURL: "http://127.0.0.1:8000/api", //backend Django
});

// Empleados
export const listarEmpleados = () => empleadosApi.get("/empleados/");
export const crearEmpleado = (empleado) => empleadosApi.post("/empleados/", empleado);
export const actualizarEmpleado = (id, empleado) => empleadosApi.put(`/empleados/${id}/`, empleado);
export const eliminarEmpleado = (id) => empleadosApi.delete(`/empleados/${id}/`);

