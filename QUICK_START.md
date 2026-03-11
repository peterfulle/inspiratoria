# 🚀 Guía de Inicio Rápido - Sistema de Onboarding

## ✅ **Sistema Listo para Probar**

Todo está implementado y funcionando. Sigue estos pasos para probar el flujo completo.

---

## 📋 **Pasos para Probar (5 minutos)**

### **1. Asegúrate que los servidores estén corriendo**

```bash
# Terminal 1: Backend (desde directorio raíz)
bash start_backend.sh
```

```bash
# Terminal 2: Frontend (desde directorio raíz)
cd frontend && npm run dev
```

Verifica:
- ✅ Backend: http://localhost:8000/api/docs
- ✅ Frontend: http://localhost:3000

---

### **2. Genera una Invitación de Prueba**

```bash
# Desde el directorio raíz del proyecto
.venv/bin/python backend/generate_invitation.py test@ejemplo.com mentor
```

**Salida esperada:**
```
✅ ¡Invitación creada exitosamente!
======================================================================
📧 Email: test@ejemplo.com
👤 Rol: mentor
🏢 Empresa: Neuramorphic AI
📚 Programa: Liderazgo 2025
👨‍💼 Invitado por: Administrador General
🔑 Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
⏰ Expira: 2025-12-10 07:35
======================================================================

🔗 URL de Onboarding:
   http://localhost:3000/onboarding?token=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**COPIA EL ENLACE COMPLETO** ⬆️

---

### **3. Inicia el Proceso de Onboarding**

1. **Abre el enlace en modo incógnito** (⌘+Shift+N en Chrome/Edge)
   - Esto simula un usuario nuevo sin sesión

2. **PASO 1: Validar Invitación** ✅
   - Verás la información de tu invitación
   - Click en "Continuar"

3. **PASO 2: Crear Cuenta** 👤
   - Nombre completo: `Tu Nombre`
   - Contraseña: `Test1234` (mínimo 8 caracteres)
   - Confirmar contraseña: `Test1234`
   - Click en "Crear Cuenta"

4. **PASO 3: Conectar LinkedIn** 🔗
   
   **Opción A: CON LinkedIn (Recomendado)** 🌟
   - Click en "Conectar con LinkedIn"
   - Serás redirigido a LinkedIn
   - **Autoriza la aplicación** (usa tu cuenta personal)
   - Espera 3-5 segundos mientras la IA procesa
   - Redirige automáticamente al Paso 4
   - ¡Verás tu perfil pre-completado por IA! ✨
   
   **Opción B: Sin LinkedIn (Manual)** ⌨️
   - Click en "Omitir - Completar manual"
   - Formulario vacío para llenar

5. **PASO 4: Revisar Perfil** 📝
   - **Con LinkedIn:** Datos extraídos automáticamente
     - Bio profesional generada por IA
     - Skills identificadas
   - **Sin LinkedIn:** Completa manualmente
   - Edita lo que necesites
   - Click en "Continuar"

6. **PASO 5: Configuración de Rol** ⚙️
   
   **Para Mentor:**
   - Selecciona áreas de expertise
   - Define disponibilidad semanal (slider)
   - Preferencias de mentees
   
   **Para Mentee:**
   - Describe tus objetivos
   - Selecciona áreas de desarrollo
   - Preferencias de mentor

7. **PASO 6: Confirmación** ✅
   - Revisa toda tu información
   - Click en "Completar Registro"
   - **Auto-login** → Redirige al dashboard
   - ¡Listo! 🎉

---

## 🎬 **Flujos de Prueba Sugeridos**

### **Test 1: Mentor con LinkedIn** (Recomendado primero)
```bash
.venv/bin/python backend/generate_invitation.py mentor1@test.com mentor
```
- Sigue el flujo completo
- Usa LinkedIn OAuth
- Observa la extracción de IA

### **Test 2: Mentee sin LinkedIn**
```bash
.venv/bin/python backend/generate_invitation.py mentee1@test.com mentee
```
- Sigue el flujo completo
- Omite LinkedIn
- Completa todo manualmente

### **Test 3: Desde el UI (Próximamente)**
1. Login como admin: http://localhost:3000/login
2. AdminDashboard → Participantes → "Agregar Participante"
3. Completa: email, rol, programa
4. Click "Enviar Invitación"
5. Copia el link del modal de éxito
6. Continúa desde el paso 3 anterior

---

## 📊 **Comandos Útiles**

### **Listar Invitaciones Pendientes**
```bash
.venv/bin/python backend/generate_invitation.py --list
```

### **Crear Mentor**
```bash
.venv/bin/python backend/generate_invitation.py mentor@empresa.com mentor
```

### **Crear Mentee**
```bash
.venv/bin/python backend/generate_invitation.py mentee@empresa.com mentee
```

### **Especificar Programa**
```bash
.venv/bin/python backend/generate_invitation.py test@test.com mentor 1
#                                                                    ↑ Program ID
```

---

## 🎯 **Qué Observar Durante las Pruebas**

### **UI/UX:**
- ✅ Barra de progreso con 6 pasos
- ✅ Iconos animados
- ✅ Transiciones suaves entre pasos
- ✅ Validación en cada paso
- ✅ Mensajes de error claros
- ✅ Estados de loading

### **LinkedIn OAuth:**
- ✅ Redirección a LinkedIn funciona
- ✅ Autorización exitosa
- ✅ Callback procesa correctamente
- ✅ Pantalla de "Procesando..." visible
- ✅ Datos extraídos correctamente

### **Gemini AI:**
- ✅ Bio profesional generada (3-4 párrafos)
- ✅ Skills identificadas
- ✅ Información profesional estructurada
- ✅ Español nativo y natural

### **Funcionalidad:**
- ✅ Token valida correctamente
- ✅ Cuenta se crea en Django
- ✅ Perfil se guarda completo
- ✅ Auto-login funciona
- ✅ Redirige al dashboard correcto

---

## 🐛 **Troubleshooting Rápido**

### **Error: "Token inválido o expirado"**
```bash
# Genera nuevo token
.venv/bin/python backend/generate_invitation.py nuevo@email.com mentor
```

### **LinkedIn callback con error**
- Verifica que `.env` tenga:
  ```
  LINKEDIN_REDIRECT_URI=http://localhost:3000/onboarding/linkedin-callback
  ```
- Regenera OAuth code (expiran en 10 minutos)

### **Backend no responde**
```bash
# Reinicia backend
bash start_backend.sh
```

### **Frontend con errores**
```bash
cd frontend
npm install  # Por si falta algún paquete
npm run dev
```

---

## 📝 **Checklist de Testing**

Usa esto para validar que todo funciona:

### **Backend:**
- [ ] Servidor corre en puerto 8000
- [ ] `/api/docs` accesible
- [ ] Script de invitaciones funciona
- [ ] Base de datos accesible

### **Frontend:**
- [ ] Servidor corre en puerto 3000
- [ ] Página de onboarding carga
- [ ] LinkedIn callback page existe

### **Flujo Completo:**
- [ ] Genera invitación exitosamente
- [ ] PASO 1: Valida token
- [ ] PASO 2: Crea cuenta
- [ ] PASO 3: LinkedIn OAuth funciona
- [ ] PASO 4: Perfil pre-completado
- [ ] PASO 5: Configuración de rol
- [ ] PASO 6: Confirma y completa
- [ ] Auto-login funciona
- [ ] Redirige a dashboard

---

## 🎉 **¿Qué Hacer Después de Probar?**

1. **Revisar datos en Admin:**
   - http://localhost:8000/admin
   - Login con usuario admin
   - Verifica `PendingInvitation` y `OnboardingProgress`

2. **Probar variaciones:**
   - Mentor vs Mentee
   - Con LinkedIn vs Sin LinkedIn
   - Diferentes configuraciones

3. **Feedback:**
   - ¿Algún paso confuso?
   - ¿Algo que mejorar en UX?
   - ¿Bugs encontrados?

---

## 📚 **Documentación Completa**

Para más detalles técnicos:
- **Sistema completo:** `ONBOARDING_SYSTEM.md` (800 líneas)
- **Resumen ejecutivo:** `ONBOARDING_SUMMARY.md` (500 líneas)

---

## 🚀 **¡Listo para Probar!**

```bash
# 1. Genera invitación
.venv/bin/python backend/generate_invitation.py test@ejemplo.com mentor

# 2. Copia el URL que aparece

# 3. Abre en modo incógnito

# 4. ¡Disfruta el flujo de onboarding! 🎉
```

**Tip:** Prueba primero con LinkedIn OAuth para ver la magia de la IA ✨
