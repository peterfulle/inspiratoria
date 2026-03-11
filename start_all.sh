#!/bin/bash

# Script para iniciar Backend y Frontend simultáneamente
# Inspiratoria - Sistema completo

echo "🚀 Iniciando Sistema Inspiratoria..."
echo ""

# Colores para el output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directorio base
BASE_DIR="/Users/peterfulle/Downloads/INSPIRATORIA 2"

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servidores..."
    pkill -P $$ 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Limpiar puertos antes de iniciar
echo "🧹 Limpiando puertos 8001 y 3000..."
lsof -ti:8001 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 1

echo ""
echo "${YELLOW}========================================${NC}"
echo "${YELLOW}  INSPIRATORIA - Sistema de Mentoring  ${NC}"
echo "${YELLOW}========================================${NC}"
echo ""

# Iniciar Backend
echo "${GREEN}📡 Iniciando Backend en puerto 8001...${NC}"
cd "$BASE_DIR/backend"
"$BASE_DIR/.venv/bin/python" -m uvicorn mentorloop_clone.asgi:application --host 0.0.0.0 --port 8001 --reload > /tmp/inspiratoria_backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Esperar a que el backend esté listo
echo "   Esperando que el backend inicie..."
sleep 3

# Verificar que el backend está corriendo
if ! ps -p $BACKEND_PID > /dev/null; then
    echo "❌ Error: Backend no pudo iniciar"
    echo "Ver logs en: /tmp/inspiratoria_backend.log"
    exit 1
fi

# Iniciar Frontend
echo ""
echo "${BLUE}🎨 Iniciando Frontend en puerto 3000...${NC}"
cd "$BASE_DIR/frontend"
npm run dev > /tmp/inspiratoria_frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

# Esperar a que el frontend esté listo
echo "   Esperando que el frontend inicie..."
sleep 5

echo ""
echo "${GREEN}========================================${NC}"
echo "${GREEN}✅ Sistema Iniciado Correctamente${NC}"
echo "${GREEN}========================================${NC}"
echo ""
echo "📡 Backend:  http://localhost:8001"
echo "🎨 Frontend: http://localhost:3000"
echo ""
echo "📋 Logs:"
echo "   Backend:  tail -f /tmp/inspiratoria_backend.log"
echo "   Frontend: tail -f /tmp/inspiratoria_frontend.log"
echo ""
echo "⚠️  Presiona Ctrl+C para detener ambos servidores"
echo ""

# Mantener el script corriendo y mostrar logs en tiempo real
tail -f /tmp/inspiratoria_backend.log /tmp/inspiratoria_frontend.log &
TAIL_PID=$!

# Esperar indefinidamente
wait $BACKEND_PID $FRONTEND_PID
