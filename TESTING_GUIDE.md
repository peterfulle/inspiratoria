# 🧪 Guía Rápida de Testing - Dashboards por Rol

## 🚀 Inicio Rápido

### 1. Lanzar el Sistema

**Backend:**
```bash
bash /Users/peterfulle/Desktop/Inspiratoria/start_backend.sh
```

**Frontend:**
```bash
cd /Users/peterfulle/Desktop/Inspiratoria/frontend && npm run dev
```

### 2. Abrir la Aplicación

Navega a: http://localhost:3000/dashboard

### 3. Usar las Funciones de Testing

Abre la **Consola del Navegador** (F12 → Console) y verás:

```
🎯 INSPIRATORIA - Testing Utilities Loaded!

🧪 FUNCIONES DE TESTING DISPONIBLES:

testAsAdmin()                  - Probar como Admin
testAsClient()                 - Probar como Cliente
testAsFacilitatorInternal()    - Probar como Facilitador Interno
testAsFacilitatorInspiratoria()- Probar como Facilitador Inspiratoria
testAsMentor()                 - Probar como Mentor
testAsMentee()                 - Probar como Mentee
testAsSuperadmin()             - Probar como Superadmin
testAsCoordinator()            - Probar como Coordinador

whoAmI()                       - Ver usuario actual
testLogout()                   - Cerrar sesión
```

---

## 📋 Testing por Rol

### 1️⃣ Testing como **MENTEE** (Ya configurado)

**En la consola:**
```javascript
testAsMentee()
// Recarga la página
```

**Qué debes ver:**
- ✅ **Dashboard:** MenteeDashboard con mentor card
- ✅ **Menú Sidebar:** Dashboard, Chat, Objetivos, Calendario
- ✅ **Badge:** 👨‍🎓 mentee
- ✅ **Funcionalidad:** Ver mentor asignado, objectives, chat

**Verificar:**
- [ ] Se muestra el dashboard correcto (vista de mentee)
- [ ] El menú solo tiene 4 elementos
- [ ] El badge del rol es correcto
- [ ] No aparecen opciones de admin (Programas, Participantes, etc.)

---

### 2️⃣ Testing como **MENTOR**

**En la consola:**
```javascript
testAsMentor()
// Recarga la página
```

**Qué debes ver:**
- ✅ **Dashboard:** MentorDashboard con lista de mentees
- ✅ **Menú Sidebar:** Dashboard, Chat, Objetivos, Calendario
- ✅ **Badge:** 👨‍🏫 mentor
- ✅ **Funcionalidad:** Ver todos los mentees, stats, tips

**Verificar:**
- [ ] Se muestra el dashboard de mentor
- [ ] Puede ver múltiples mentees
- [ ] Stats cards funcionan
- [ ] Tips para mentores visibles

---

### 3️⃣ Testing como **ADMIN**

**En la consola:**
```javascript
testAsAdmin()
// Recarga la página
```

**Qué debes ver:**
- ✅ **Dashboard:** AdminDashboard con gestión completa
- ✅ **Menú Sidebar:** Dashboard, Programas, Participantes, Matches, Calendario, Analytics, Reportes
- ✅ **Badge:** 👑 admin
- ✅ **Funcionalidad:** Crear programas, agregar participantes, matching

**Verificar:**
- [ ] Se muestra el dashboard administrativo
- [ ] 7 elementos en el menú
- [ ] Botones de "Acciones Rápidas" visibles
- [ ] 4 gráficos Chart.js cargados
- [ ] Puede abrir modales (Crear Programa, etc.)

---

### 4️⃣ Testing como **CLIENT**

**En la consola:**
```javascript
testAsClient()
// Recarga la página
```

**Qué debes ver:**
- ✅ **Dashboard:** ClientDashboard con KPIs ejecutivos
- ✅ **Menú Sidebar:** Dashboard, Programas, Calendario, Analytics, Reportes
- ✅ **Badge:** 👑 client
- ✅ **Funcionalidad:** Vista ejecutiva, gráficos, exportar

**Verificar:**
- [ ] Vista ejecutiva (solo lectura)
- [ ] 4 KPI cards con trending
- [ ] Panel de impacto visible
- [ ] 4 gráficos Chart.js
- [ ] Botones de exportar funcionan
- [ ] NO hay botones de crear/editar

---

### 5️⃣ Testing como **FACILITATOR INTERNAL**

**En la consola:**
```javascript
testAsFacilitatorInternal()
// Recarga la página
```

**Qué debes ver:**
- ✅ **Dashboard:** FacilitatorDashboard con sesiones
- ✅ **Menú Sidebar:** Dashboard, Participantes, Matches, Sesiones, Calendario
- ✅ **Badge:** 🎯 Facilitador Interno
- ✅ **Funcionalidad:** Gestionar sesiones, tomar asistencia

**Verificar:**
- [ ] Lista de 12 sesiones mock
- [ ] Modal de asistencia funciona
- [ ] Stats de sesiones correctas
- [ ] Puede ver matches

---

### 6️⃣ Testing como **FACILITATOR INSPIRATORIA**

**En la consola:**
```javascript
testAsFacilitatorInspiratoria()
// Recarga la página
```

**Qué debes ver:**
- ✅ **Dashboard:** FacilitatorDashboard
- ✅ **Menú Sidebar:** Dashboard, Participantes, Sesiones, Calendario
- ✅ **Badge:** 🎯 Facilitador
- ✅ **Funcionalidad:** Similar a facilitador interno

**Verificar:**
- [ ] Menos elementos en menú (sin Matches)
- [ ] Puede gestionar sesiones
- [ ] Puede ver participantes

---

### 7️⃣ Testing como **SUPERADMIN**

**En la consola:**
```javascript
testAsSuperadmin()
// Recarga la página
```

**Qué debes ver:**
- ✅ **Dashboard:** AdminDashboard (igual que admin)
- ✅ **Menú completo:** Todos los elementos
- ✅ **Badge:** 👑 superadmin
- ✅ **Funcionalidad:** Full access

---

### 8️⃣ Testing como **COORDINATOR**

**En la consola:**
```javascript
testAsCoordinator()
// Recarga la página
```

**Qué debes ver:**
- ✅ **Dashboard:** AdminDashboard
- ✅ **Menú completo:** Similar a admin
- ✅ **Badge:** 👑 coordinator

---

## 🔍 Verificaciones Generales

### Para TODOS los roles:

1. **Sidebar correcto:**
   - [ ] Logo carga correctamente
   - [ ] Nombre de usuario visible
   - [ ] Badge de rol correcto
   - [ ] Notificaciones funcionan
   - [ ] Toggle dark/light mode funciona
   - [ ] Botón de logout funciona

2. **Dashboard correcto:**
   - [ ] Se carga el componente apropiado
   - [ ] No hay errores en consola
   - [ ] Datos mock se muestran correctamente
   - [ ] Navegación entre vistas funciona

3. **Permisos:**
   - [ ] Solo ve elementos de menú permitidos
   - [ ] No aparecen botones de acciones no permitidas

---

## 🐛 Solución de Problemas

### Problema: "No se carga el dashboard"
**Solución:**
```javascript
// Verificar usuario actual
whoAmI()

// Si no hay usuario o el rol está mal:
testAsAdmin() // o el rol que quieras
// Recarga la página
```

### Problema: "Menú vacío o incorrecto"
**Solución:**
1. Verificar que el rol esté escrito correctamente
2. Roles válidos: `admin`, `client`, `mentor`, `mentee`, `facilitator_internal`, `facilitator_inspiratoria`, `superadmin`, `coordinator`
3. Re-ejecutar la función de test correspondiente

### Problema: "Dashboard no coincide con el rol"
**Solución:**
```javascript
// Limpiar todo y empezar de nuevo
testLogout()
// Recarga la página
// Ejecuta la función de test del rol que quieres
testAsAdmin()
// Recarga la página
```

### Problema: "Errores en consola"
**Solución:**
1. Verificar que el backend esté corriendo en http://localhost:8001
2. Verificar que haya datos en el backend (programas, participantes, matches)
3. Revisar logs del backend para errores

---

## 📊 Checklist de Testing Completo

### Fase 1: Testing Individual por Rol
- [ ] Mentee
- [ ] Mentor
- [ ] Admin
- [ ] Client
- [ ] Facilitator Internal
- [ ] Facilitator Inspiratoria
- [ ] Superadmin
- [ ] Coordinator

### Fase 2: Testing de Navegación
- [ ] Cambiar entre vistas del dashboard funciona
- [ ] Sidebar se actualiza correctamente
- [ ] Active view se marca correctamente
- [ ] URLs se actualizan (si aplica)

### Fase 3: Testing de Permisos
- [ ] Admin puede crear programas
- [ ] Admin puede agregar participantes
- [ ] Admin puede ejecutar matching
- [ ] Client NO puede crear/editar (solo ver)
- [ ] Facilitador puede gestionar sesiones
- [ ] Mentor puede ver sus mentees
- [ ] Mentee puede ver su mentor

### Fase 4: Testing de UI
- [ ] Dark mode funciona para todos los roles
- [ ] Modales se abren y cierran correctamente
- [ ] Gráficos Chart.js se renderizan
- [ ] Responsive design funciona (mobile, tablet, desktop)
- [ ] Animaciones y transiciones suaves

### Fase 5: Testing de Integración
- [ ] Logout funciona desde cualquier rol
- [ ] Cambiar de rol funciona correctamente
- [ ] localStorage se maneja correctamente
- [ ] No hay memory leaks al cambiar de rol

---

## 🎯 Comandos Útiles

```javascript
// Ver usuario actual
whoAmI()

// Cerrar sesión
testLogout()

// Cambiar rápidamente entre roles
testAsMentee()     // Recarga
testAsMentor()     // Recarga
testAsAdmin()      // Recarga
testAsClient()     // Recarga

// Ver funciones disponibles nuevamente
showTestFunctions()
```

---

## 📝 Notas

- **Datos Mock:** Todos los dashboards usan datos mock excepto Admin que carga desde API
- **Backend necesario:** Para testing completo, necesitas backend corriendo con datos
- **Hot Reload:** Los cambios en el código se reflejan automáticamente (no necesitas recargar)
- **Console Warnings:** Los warnings de React DevTools y Next.js Image son normales en desarrollo

---

## ✅ Testing Completado

Una vez que hayas verificado todos los roles y funcionalidades, marca como completo:

```javascript
console.log("✅ Testing de todos los roles completado!");
console.log("🎉 Sistema de dashboards funcionando correctamente");
```

---

**Happy Testing! 🚀**
