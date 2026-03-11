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
        {/* Testing utilities - Habilitado para testing en producción */}
        <script src="/test-roles.js" />
      </body>
    </html>
  );
}
