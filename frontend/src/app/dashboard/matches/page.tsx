"use client";

import { useEffect, useState } from "react";
import AdminDashboard from "@/components/dashboards/AdminDashboard";

export default function MatchesPage() {
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
    <AdminDashboard
      userId={user.id || 1}
      username={user.username || user.full_name || user.email}
      role={user.role}
      darkMode={darkMode}
      activeView="matches"
      onViewChange={() => {}}
    />
  );
}
