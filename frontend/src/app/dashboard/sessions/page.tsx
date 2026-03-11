"use client";

import { useEffect, useState } from "react";
import FacilitatorDashboard from "@/components/dashboards/FacilitatorDashboard";

export default function SessionsPage() {
  const [user, setUser] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const theme = localStorage.getItem("theme");
    
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setDarkMode(theme === "dark");
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  if (!user) return null;

  return (
    <FacilitatorDashboard
      userId={String(user.id || 1)}
      userName={user.username || user.full_name || user.email}
      role={user.role}
      darkMode={darkMode}
      companyId="1"
      activeView="sessions"
      onViewChange={() => {}}
    />
  );
}
