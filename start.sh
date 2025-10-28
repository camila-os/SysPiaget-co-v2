#!/bin/bash

# ===============================
# Script para iniciar backend y frontend
# ===============================

# Salir si ocurre un error
set -e

# Colores para mensajes
GREEN='\033[0;32m'
NC='\033[0m' # Sin color

#Activar Entorno Virtual

if [ -d "env" ]; then
  source env/bin/activate
fi

# --- BACKEND ---
echo -e "${GREEN}Iniciando servidor Python (backend)...${NC}"
cd backend

# Iniciar backend en segundo plano
python3 manage.py runserver &

# Guardar el PID para poder cerrarlo si es necesario
BACKEND_PID=$!

cd ..

# --- FRONTEND ---
echo -e "${GREEN}Iniciando servidor React + Vite (frontend)...${NC}"
cd client

# Asegurarse de que las dependencias estén instaladas
if [ ! -d "node_modules" ]; then
  echo -e "${GREEN}Instalando dependencias de React...${NC}"
  npm install
fi

npm cache clean --force
npm run dev

FRONTEND_PID=$!

cd ..

# --- MONITOREO ---
echo -e "${GREEN}Servidores en ejecución.${NC}"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Presioná Ctrl+C para detenerlos."

# Esperar a que terminen ambos procesos
wait
