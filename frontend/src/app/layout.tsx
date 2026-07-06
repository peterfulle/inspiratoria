import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inspiratoria - Plataforma de Mentoría",
  description: "Gestiona programas de mentoría con matching inteligente",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full bg-gray-50 text-gray-900 overflow-x-hidden">
        {children}
        {/* Testing utilities: solo en desarrollo. En producción exponía funciones
            (testAsAdmin, testAsSuperadmin, etc.) que escriben usuarios falsos
            con ids no-UUID en localStorage, causando errores reales (ej. 500 en
            /api/notifications/user/1) cuando alguien las ejecutaba sin querer. */}
        {process.env.NODE_ENV !== "production" && <script src="/test-roles.js" />}
      </body>
    </html>
  );
}
