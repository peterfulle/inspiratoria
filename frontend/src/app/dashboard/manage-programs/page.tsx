'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página consolidada.
 *
 * Esta ruta era una segunda lista (huérfana, fuera del menú) de las mismas
 * instancias de programa que ahora vive en la pestaña «Programas» de
 * /dashboard/programs. Para tener una sola fuente de verdad, redirige allí.
 */
export default function ManageProgramsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/programs?tab=programs');
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 12 }}>
      <div style={{ width: 22, height: 22, border: '3px solid #e5e7eb', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: '#6b7280', fontSize: 14 }}>Redirigiendo a Programas…</span>
    </div>
  );
}
