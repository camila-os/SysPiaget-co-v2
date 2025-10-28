import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/empleados/";

export const listarRoles = () => axios.get("http://127.0.0.1:8000/api/roles/");

export const actualizarEmpleado = (dni, empleado) =>
  axios.put(`${API_URL}${dni}/`, empleado);
