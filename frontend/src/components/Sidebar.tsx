"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { hasPermission, isAdmin, isFacilitator, isParticipant } from "@/lib/permissions";
import type { UserRole } from "@/lib/permissions";

type SidebarProps = {
  username: string;
  role: string;
  userId?: number;
};

// Modern SVG Icons with gradient support
const IconDashboard = ({ className = "w-5 h-5", active = false }: { className?: string; active?: boolean }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
  </svg>
);

const IconClients = ({ className = "w-5 h-5", active = false }: { className?: string; active?: boolean }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const IconUsers = ({ className = "w-5 h-5", active = false }: { className?: string; active?: boolean }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const IconAnalytics = ({ className = "w-5 h-5", active = false }: { className?: string; active?: boolean }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const IconSettings = ({ className = "w-5 h-5", active = false }: { className?: string; active?: boolean }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconChat = ({ className = "w-5 h-5", active = false }: { className?: string; active?: boolean }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const IconGoals = ({ className = "w-5 h-5", active = false }: { className?: string; active?: boolean }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const IconInvestors = ({ className = "w-5 h-5", active = false }: { className?: string; active?: boolean }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconPrograms = ({ className = "w-5 h-5", active = false }: { className?: string; active?: boolean }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const IconEcosystem = ({ className = "w-5 h-5", active = false }: { className?: string; active?: boolean }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
    <circle cx="12" cy="5" r="3"/>
    <circle cx="5" cy="19" r="3"/>
    <circle cx="19" cy="19" r="3"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v3M8.5 17l2.5-4M15.5 17l-2.5-4"/>
  </svg>
);

const IconAccounts = ({ className = "w-5 h-5", active = false }: { className?: string; active?: boolean }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const IconBilling = ({ className = "w-5 h-5", active = false }: { className?: string; active?: boolean }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

// Menu item definition
interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; active?: boolean }>;
  path: string;
  badge?: string;
  badgeColor?: string;
  comingSoon?: boolean;
  subItems?: { id: string; label: string; path: string }[];
}

// Menu sections
interface MenuSection {
  title: string;
  items: MenuItem[];
  roles: UserRole[];
}

// Get role display name
const getRoleDisplayName = (role: string): string => {
  const roleNames: Record<string, string> = {
    superadmin: "Super Admin",
    inspiratoria_admin: "Admin Inspiratoria",
    admin: "Administrador",
    coordinator: "Coordinador",
    facilitator_internal: "Facilitador",
    facilitator_inspiratoria: "Facilitador Inspiratoria",
    mentor: "Mentor",
    mentee: "Mentee",
    client: "Cliente",
  };
  return roleNames[role] || role;
};

// Get initials from username
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function Sidebar({ username, role, userId = 1 }: SidebarProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true); // Inicialmente colapsado
  const [isHovered, setIsHovered] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  
  // Extract active view from pathname
  const getActiveView = () => {
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname?.includes('/dashboard/users')) return 'users';
    if (pathname?.includes('/dashboard/analytics')) return 'analytics';
    if (pathname?.includes('/dashboard/configuration')) return 'configuration';
    if (pathname?.includes('/dashboard/chat')) return 'chat';
    if (pathname?.includes('/dashboard/goals')) return 'goals';
    if (pathname?.includes('/investors')) return 'investors';
    return 'dashboard';
  };
  
  const activeView = getActiveView();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
    }
    // Siempre iniciar colapsado
    setIsCollapsed(true);
  }, []);

  // Manejar expansión/contracción automática con hover
  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsCollapsed(false);
    localStorage.setItem("sidebarCollapsed", "false");
    window.dispatchEvent(new Event("sidebarToggle"));
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsCollapsed(true);
    localStorage.setItem("sidebarCollapsed", "true");
    window.dispatchEvent(new Event("sidebarToggle"));
  };

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  // Menu sections based on role
  const getMenuSections = (): MenuSection[] => {
    const isAdminRole = ["superadmin", "inspiratoria_admin", "admin", "admin_root"].includes(role);
    const isParticipantRole = ["mentor", "mentee"].includes(role);
    
    const sections: MenuSection[] = [];
    
    // Principal section - always visible
    sections.push({
      title: "Principal",
      roles: ["superadmin", "inspiratoria_admin", "client", "admin", "admin_root", "coordinator", "facilitator_internal", "facilitator_inspiratoria", "mentor", "mentee"],
      items: [
        { id: "dashboard", label: "Vista General", icon: IconDashboard, path: "/dashboard" },
      ],
    });
    
    // Admin management section
    if (isAdminRole) {
      sections.push({
        title: "Gestión",
        roles: ["superadmin", "inspiratoria_admin", "admin", "admin_root"],
        items: [
          { 
            id: "accounts", 
            label: "Cuentas", 
            icon: IconAccounts, 
            path: "/dashboard/accounts",
            subItems: [
              { id: "accounts-internal", label: "Cuentas Internas", path: "/dashboard/accounts/internal" },
              { id: "accounts-subscription", label: "Cuentas Suscripción", path: "/dashboard/accounts/subscription" },
            ]
          },
          { id: "billing", label: "Facturación", icon: IconBilling, path: "/dashboard/billing" },
          { id: "programs", label: "Programas", icon: IconPrograms, path: "/dashboard/programs" },
          { id: "users", label: "Usuarios", icon: IconUsers, path: "/dashboard/users" },
          { id: "analytics", label: "Analytics", icon: IconAnalytics, path: "/dashboard/analytics", comingSoon: true },
          { id: "ecosystem", label: "Ecosistema", icon: IconEcosystem, path: "/dashboard/ecosystem" },
        ],
      });
    }
    
    // Participant tools
    if (isParticipantRole) {
      sections.push({
        title: "Herramientas",
        roles: ["mentor", "mentee"],
        items: [
          { id: "chat", label: "Mensajes", icon: IconChat, path: "/dashboard/chat", badge: "3", badgeColor: "bg-primary-500" },
          { id: "goals", label: "Objetivos", icon: IconGoals, path: "/dashboard/goals" },
        ],
      });
    }
    
    // System section for admins
    if (isAdminRole) {
      sections.push({
        title: "Sistema",
        roles: ["superadmin", "inspiratoria_admin", "admin", "admin_root"],
        items: [
          { id: "configuration", label: "Configuración", icon: IconSettings, path: "/dashboard/configuration" },
        ],
      });
    }
    
    return sections.filter(section => section.roles.includes(role as UserRole));
  };

  const menuSections = getMenuSections();

  // Toggle submenu expansion
  const toggleSubmenu = (itemId: string) => {
    setExpandedMenus(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Render menu item with modern styling
  const renderMenuItem = (item: MenuItem) => {
    const IconComponent = item.icon;
    const isActive = activeView === item.id || pathname?.includes(item.path);
    const isHoveredItem = hoveredItem === item.id;
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedMenus.includes(item.id);
    
    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasSubItems) {
              toggleSubmenu(item.id);
            } else if (!item.comingSoon) {
              router.push(item.path);
            }
          }}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
          disabled={item.comingSoon}
          className={`group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-300 ease-out ${
            item.comingSoon ? "cursor-not-allowed opacity-60" : ""
          } ${
            isActive
              ? "bg-gradient-to-r from-primary-500/10 to-primary-500/5 text-primary-600"
              : darkMode
              ? "text-gray-400 hover:bg-white/5 hover:text-white"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          {/* Active indicator bar */}
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full transition-all duration-300 ${
            isActive 
              ? "bg-primary-500 opacity-100" 
              : isHoveredItem && !item.comingSoon
              ? "bg-gray-300 opacity-50"
              : "opacity-0"
          }`} />
          
          {/* Icon with animation */}
          <div className={`relative flex items-center justify-center transition-transform duration-300 ${
            isHoveredItem && !item.comingSoon ? "scale-110" : ""
          }`}>
            <IconComponent 
              className={`w-5 h-5 transition-colors duration-300 ${
                isActive ? "text-primary-500" : ""
              }`} 
              active={isActive}
            />
            {/* Icon glow effect on active */}
            {isActive && (
              <div className="absolute inset-0 w-5 h-5 bg-primary-500/20 rounded-full blur-md" />
            )}
          </div>
          
          {/* Label */}
          {!isCollapsed && (
            <span className={`font-medium text-sm flex-1 transition-colors duration-300 ${
              isActive ? "font-semibold" : ""
            }`}>
              {item.label}
            </span>
          )}
          
          {/* Chevron for submenu */}
          {hasSubItems && !isCollapsed && (
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
          
          {/* Badge */}
          {item.badge && !isCollapsed && (
            <span className={`${item.badgeColor || "bg-gray-500"} text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center animate-pulse`}>
              {item.badge}
            </span>
          )}
          
          {/* Coming soon tag */}
          {item.comingSoon && !isCollapsed && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              Pronto
            </span>
          )}
        </button>
        
        {/* Submenu items */}
        {hasSubItems && isExpanded && !isCollapsed && (
          <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
            {item.subItems?.map(subItem => {
              const isSubActive = pathname === subItem.path;
              return (
                <button
                  key={subItem.id}
                  onClick={() => router.push(subItem.path)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                    isSubActive
                      ? "bg-primary-500/10 text-primary-600 font-medium"
                      : darkMode
                      ? "text-gray-400 hover:text-white hover:bg-white/5"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {subItem.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Sidebar con transición suave y auto-expansión con hover */}
      <aside 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed left-0 top-0 h-full border-r transition-all duration-300 flex flex-col z-40 ${
          isCollapsed ? 'w-[72px]' : 'w-72'
        } ${
          darkMode 
            ? "border-gray-800/50 bg-gradient-to-b from-gray-900 to-gray-950" 
            : "border-gray-100 bg-gradient-to-b from-white to-gray-50/50"
        }`}
      >
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        {/* Header Section */}
        <div className={`relative p-6 border-b ${darkMode ? 'border-gray-800/50' : 'border-gray-100'}`}>
          {/* Logo - Solo cuando está expandido */}
          {!isCollapsed && (
            <div className="relative transition-all duration-300">
              <Image 
                src="/images/logo.png" 
                alt="Inspiratoria" 
                width={160} 
                height={42} 
                className="w-40 drop-shadow-sm"
                priority
                style={{ width: 'auto', height: 'auto' }}
              />
            </div>
          )}
          
          {/* User profile card - Solo cuando está expandido */}
          {!isCollapsed && (
            <div className={`mt-5 p-3 rounded-xl border transition-all duration-300 ${
              darkMode 
                ? "bg-white/5 border-gray-800/50 hover:bg-white/10" 
                : "bg-gray-50/80 border-gray-100 hover:bg-gray-100/80"
            }`}>
              <div className="flex items-center gap-3">
                {/* Avatar with gradient border */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary-500/25">
                    {getInitials(username)}
                  </div>
                  {/* Online indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm truncate ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {username}
                  </p>
                  <p className={`text-xs truncate ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                    {getRoleDisplayName(role)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Avatar solo cuando está colapsado */}
          {isCollapsed && (
            <div className="flex justify-center">
              <div className="relative group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary-500/25 cursor-pointer">
                  {getInitials(username)}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                
                {/* Tooltip */}
                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                  {username}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
          {menuSections.map((section, index) => (
            <div key={section.title} className={index > 0 ? "mt-6" : ""}>
              {/* Section title */}
              {!isCollapsed && (
                <div className="flex items-center gap-2 mb-3 px-2">
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${
                    darkMode ? "text-gray-600" : "text-gray-400"
                  }`}>
                    {section.title}
                  </p>
                  <div className={`flex-1 h-px ${darkMode ? "bg-gray-800" : "bg-gray-200"}`} />
                </div>
              )}
              
              {/* Separador cuando está colapsado */}
              {isCollapsed && index > 0 && (
                <div className={`h-px mx-2 mb-3 ${darkMode ? "bg-gray-800" : "bg-gray-200"}`} />
              )}
              
              {/* Menu items */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeView === item.id;
                  const isHovered = hoveredItem === item.id;
                  
                  return (
                    <div key={item.id} className="relative group">
                      <button
                        onClick={() => !item.comingSoon && router.push(item.path)}
                        onMouseEnter={() => setHoveredItem(item.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                        disabled={item.comingSoon}
                        className={`group relative flex w-full items-center rounded-xl px-4 py-3 text-left transition-all duration-300 ease-out ${
                          isCollapsed ? 'justify-center' : 'gap-3'
                        } ${
                          item.comingSoon ? "cursor-not-allowed opacity-60" : ""
                        } ${
                          isActive
                            ? "bg-gradient-to-r from-primary-500/10 to-primary-500/5 text-primary-600"
                            : darkMode
                            ? "text-gray-400 hover:bg-white/5 hover:text-white"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        {/* Active indicator bar */}
                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full transition-all duration-300 ${
                          isActive 
                            ? "bg-primary-500 opacity-100" 
                            : isHovered && !item.comingSoon
                            ? "bg-gray-300 opacity-50"
                            : "opacity-0"
                        }`} />
                        
                        {/* Icon with animation */}
                        <div className={`relative flex items-center justify-center transition-transform duration-300 ${
                          isHovered && !item.comingSoon ? "scale-110" : ""
                        }`}>
                          <IconComponent 
                            className={`w-5 h-5 transition-colors duration-300 ${
                              isActive ? "text-primary-500" : ""
                            }`} 
                            active={isActive}
                          />
                          {/* Icon glow effect on active */}
                          {isActive && (
                            <div className="absolute inset-0 w-5 h-5 bg-primary-500/20 rounded-full blur-md" />
                          )}
                        </div>
                        
                        {/* Label - Solo cuando no está colapsado */}
                        {!isCollapsed && (
                          <>
                            <span className={`font-medium text-sm flex-1 transition-colors duration-300 ${
                              isActive ? "font-semibold" : ""
                            }`}>
                              {item.label}
                            </span>
                            
                            {/* Badge */}
                            {item.badge && (
                              <span className={`${item.badgeColor || "bg-gray-500"} text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center animate-pulse`}>
                                {item.badge}
                              </span>
                            )}
                            
                            {/* Coming soon tag */}
                            {item.comingSoon && (
                              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                Pronto
                              </span>
                            )}
                          </>
                        )}
                      </button>
                      
                      {/* Tooltip cuando está colapsado */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                          {item.label}
                          {item.comingSoon && " (Próximamente)"}
                          {item.badge && (
                            <span className={`ml-2 ${item.badgeColor || "bg-gray-500"} text-white text-xs font-bold px-1.5 py-0.5 rounded-full`}>
                              {item.badge}
                            </span>
                          )}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className={`p-4 border-t space-y-3 ${darkMode ? 'border-gray-800/50' : 'border-gray-100'}`}>
          {/* Theme Toggle */}
          {!isCollapsed ? (
            <div className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
              darkMode ? "bg-white/5" : "bg-gray-50"
            }`}>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${darkMode ? "bg-yellow-500/20" : "bg-blue-500/20"}`}>
                  {darkMode ? (
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Modo {darkMode ? "oscuro" : "claro"}
                </span>
              </div>
              
              <button
                onClick={toggleTheme}
                className={`relative h-6 w-11 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                  darkMode ? "bg-primary-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all duration-300 shadow-md ${
                    darkMode ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ) : (
            <button
              onClick={toggleTheme}
              className={`w-full flex justify-center p-2 rounded-xl transition-all duration-300 group relative ${
                darkMode ? "bg-white/5 hover:bg-white/10" : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              {darkMode ? (
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              )}
              
              {/* Tooltip */}
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                Cambiar tema
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
              </div>
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`group w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              isCollapsed ? 'justify-center' : 'justify-center'
            } ${
              darkMode
                ? "text-gray-400 hover:bg-red-500/10 hover:text-red-400"
                : "text-gray-500 hover:bg-red-50 hover:text-red-600"
            } relative`}
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!isCollapsed && <span>Cerrar sesión</span>}
            
            {/* Tooltip cuando está colapsado */}
            {isCollapsed && (
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                Cerrar sesión
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
