'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CoreRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const companyStr = localStorage.getItem('company');
    const userStr = localStorage.getItem('user');

    if (!userStr) {
      router.replace('/login');
      return;
    }

    if (companyStr) {
      try {
        const company = JSON.parse(companyStr);
        const slug = company?.slug || company?.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'studio';
        const query = searchParams.toString();
        router.replace(`/studio/${slug}${query ? `?${query}` : ''}`);
      } catch {
        router.replace('/login');
      }
    } else {
      router.replace('/login');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Redirigiendo a tu Studio...</p>
      </div>
    </div>
  );
}
