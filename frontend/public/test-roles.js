/**
 * TESTING UTILITIES - Funciones para probar diferentes roles
 * 
 * Uso: Copia y pega estas funciones en la consola del navegador
 * Luego recarga la página para ver el dashboard correspondiente
 */

// Admin - Full access
function testAsAdmin() {
  localStorage.setItem("user", JSON.stringify({
    id: 1,
    role: "admin",
    username: "Admin SQM",
    full_name: "Administrador SQM",
    email: "admin@sqm.com",
    company_id: 1
  }));
  console.log("✅ Usuario configurado como ADMIN");
  console.log("🔄 Recarga la página para ver AdminDashboard");
  console.log("📋 Menú esperado: Dashboard, Programas, Participantes, Matches, Calendario, Analytics, Reportes");
}

// Client - Executive view
function testAsClient() {
  localStorage.setItem("user", JSON.stringify({
    id: 2,
    role: "client",
    username: "CEO SQM",
    full_name: "CEO SQM",
    email: "ceo@sqm.com",
    company_id: 1
  }));
  console.log("✅ Usuario configurado como CLIENT");
  console.log("🔄 Recarga la página para ver ClientDashboard");
  console.log("📋 Menú esperado: Dashboard (KPIs), Programas, Calendario, Analytics, Reportes");
}

// Facilitator Internal - Session management
function testAsFacilitatorInternal() {
  localStorage.setItem("user", JSON.stringify({
    id: 3,
    role: "facilitator_internal",
    username: "María González",
    full_name: "María González",
    email: "maria.gonzalez@sqm.com",
    company_id: 1
  }));
  console.log("✅ Usuario configurado como FACILITATOR INTERNAL");
  console.log("🔄 Recarga la página para ver FacilitatorDashboard");
  console.log("📋 Menú esperado: Dashboard, Participantes, Matches, Sesiones, Calendario");
}

// Facilitator Inspiratoria - Session management
function testAsFacilitatorInspiratoria() {
  localStorage.setItem("user", JSON.stringify({
    id: 4,
    role: "facilitator_inspiratoria",
    username: "Carlos Ruiz",
    full_name: "Carlos Ruiz",
    email: "carlos@inspiratoria.org",
    company_id: 1
  }));
  console.log("✅ Usuario configurado como FACILITATOR INSPIRATORIA");
  console.log("🔄 Recarga la página para ver FacilitatorDashboard");
  console.log("📋 Menú esperado: Dashboard, Participantes, Sesiones, Calendario");
}

// Mentor - Manage mentees
function testAsMentor() {
  localStorage.setItem("user", JSON.stringify({
    id: 5,
    role: "mentor",
    username: "Pedro Sánchez",
    full_name: "Pedro Sánchez",
    email: "pedro.sanchez@sqm.com",
    company_id: 1
  }));
  console.log("✅ Usuario configurado como MENTOR");
  console.log("🔄 Recarga la página para ver MentorDashboard");
  console.log("📋 Menú esperado: Dashboard, Chat, Objetivos, Calendario");
}

// Mentee - View mentor
function testAsMentee() {
  localStorage.setItem("user", JSON.stringify({
    id: 6,
    role: "mentee",
    username: "Juan Pérez",
    full_name: "Juan Pérez",
    email: "juan.perez@sqm.com",
    company_id: 1
  }));
  console.log("✅ Usuario configurado como MENTEE");
  console.log("🔄 Recarga la página para ver MenteeDashboard");
  console.log("📋 Menú esperado: Dashboard, Chat, Objetivos, Calendario");
}

// Superadmin - God mode
function testAsSuperadmin() {
  localStorage.setItem("user", JSON.stringify({
    id: 7,
    role: "superadmin",
    username: "SuperAdmin",
    full_name: "Super Administrador",
    email: "superadmin@inspiratoria.org",
    company_id: 1
  }));
  console.log("✅ Usuario configurado como SUPERADMIN");
  console.log("🔄 Recarga la página para ver AdminDashboard");
  console.log("📋 Menú esperado: Dashboard, Programas, Participantes, Matches, Calendario, Analytics, Reportes");
}

// Coordinator - Similar to admin
function testAsCoordinator() {
  localStorage.setItem("user", JSON.stringify({
    id: 8,
    role: "coordinator",
    username: "Laura Torres",
    full_name: "Laura Torres",
    email: "laura.torres@sqm.com",
    company_id: 1
  }));
  console.log("✅ Usuario configurado como COORDINATOR");
  console.log("🔄 Recarga la página para ver AdminDashboard");
  console.log("📋 Menú esperado: Dashboard, Programas, Participantes, Matches, Calendario, Analytics, Reportes");
}

// Ver usuario actual
function whoAmI() {
  const user = localStorage.getItem("user");
  if (!user) {
    console.log("❌ No hay usuario en localStorage");
    return;
  }
  const userData = JSON.parse(user);
  console.log("👤 Usuario actual:");
  console.log(userData);
  console.log("\n🎭 Rol:", userData.role);
  console.log("📧 Email:", userData.email);
  console.log("🏢 Company ID:", userData.company_id);
}

// Logout
function testLogout() {
  localStorage.clear();
  console.log("✅ LocalStorage limpiado");
  console.log("🔄 Recarga la página para ir al login");
}

// Show all test functions
function showTestFunctions() {
  console.log("\n🧪 FUNCIONES DE TESTING DISPONIBLES:\n");
  console.log("testAsAdmin()                  - Probar como Admin");
  console.log("testAsClient()                 - Probar como Cliente");
  console.log("testAsFacilitatorInternal()    - Probar como Facilitador Interno");
  console.log("testAsFacilitatorInspiratoria()- Probar como Facilitador Inspiratoria");
  console.log("testAsMentor()                 - Probar como Mentor");
  console.log("testAsMentee()                 - Probar como Mentee");
  console.log("testAsSuperadmin()             - Probar como Superadmin");
  console.log("testAsCoordinator()            - Probar como Coordinador");
  console.log("\nwhoAmI()                       - Ver usuario actual");
  console.log("testLogout()                   - Cerrar sesión");
  console.log("\n💡 Después de ejecutar cualquier función, recarga la página");
}

// Auto-show on load
console.log("\n🎯 INSPIRATORIA - Testing Utilities Loaded!");
showTestFunctions();

// Export to global scope
window.testAsAdmin = testAsAdmin;
window.testAsClient = testAsClient;
window.testAsFacilitatorInternal = testAsFacilitatorInternal;
window.testAsFacilitatorInspiratoria = testAsFacilitatorInspiratoria;
window.testAsMentor = testAsMentor;
window.testAsMentee = testAsMentee;
window.testAsSuperadmin = testAsSuperadmin;
window.testAsCoordinator = testAsCoordinator;
window.whoAmI = whoAmI;
window.testLogout = testLogout;
window.showTestFunctions = showTestFunctions;
