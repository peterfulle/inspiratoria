#!/bin/bash

echo "🚀 Poblando base de datos en Render..."
echo "=========================================="
echo ""
echo "⚠️  NOTA: Este script requiere Render CLI instalado"
echo "    Si no lo tienes: brew install render"
echo ""

# Verifica si render CLI está instalado
if ! command -v render &> /dev/null; then
    echo "❌ Render CLI no está instalado"
    echo ""
    echo "📦 Instálalo con:"
    echo "   brew install render"
    echo ""
    echo "🌐 O usa el Shell de Render en:"
    echo "   https://dashboard.render.com/web/srv-YOUR-SERVICE-ID"
    exit 1
fi

echo "🔄 Ejecutando seed_demo en producción..."
echo ""

# Ejecuta el comando en Render
render exec inspiratoria-backend python manage.py seed_demo

echo ""
echo "=========================================="
echo "✅ ¡Listo! Tu base de datos está poblada"
echo ""
echo "🌐 Visita: https://inspiratoria-frontend.onrender.com"
echo "👤 Login: admin / admin123"
