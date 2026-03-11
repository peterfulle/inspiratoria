"use client";

import { useEffect, useState } from "react";
import MentorDashboard from "@/components/dashboards/MentorDashboard";
import MenteeDashboard from "@/components/dashboards/MenteeDashboard";

export default function ChatPage() {
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

  const role = user.role;
  const userId = String(user.id || 1);
  const username = user.username || user.full_name || user.email;

  if (role === "mentor") {
    return (
      <MentorDashboard
        userId={userId}
        userName={username}
        darkMode={darkMode}
        activeView="chat"
        onViewChange={() => {}}
      />
    );
  }

  if (role === "mentee") {
    return (
      <MenteeDashboard
        userId={userId}
        userName={username}
        darkMode={darkMode}
        activeView="chat"
        onViewChange={() => {}}
      />
    );
  }

  return <div>No tienes acceso a esta página</div>;
}
