"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiFetch } from "@/lib/api";

function LinkedInCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Procesando tu perfil de LinkedIn...');
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Get code and state from URL
      const code = searchParams.get('code');
      const state = searchParams.get('state'); // This is our token
      const error = searchParams.get('error');

      // Handle OAuth errors
      if (error) {
        setStatus('error');
        setMessage(`Error de LinkedIn: ${error}`);
        setTimeout(() => {
          router.push(`/onboarding?token=${state}`);
        }, 3000);
        return;
      }

      // Validate we have code and state
      if (!code || !state) {
        setStatus('error');
        setMessage('Faltan parámetros de OAuth');
        setTimeout(() => {
          const token = state || localStorage.getItem('onboarding_token');
          router.push(`/onboarding?token=${token}`);
        }, 3000);
        return;
      }

      try {
        // Call our backend to process LinkedIn callback
        setMessage('Conectando con LinkedIn...');
        const response = await apiFetch('/api/invitations/linkedin/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            token: state
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error al procesar el perfil');
        }

        const data = await response.json();
        
        // Success! AI has extracted the profile
        setMessage('¡Perfil extraído con IA! ✨');
        setProfileData(data);
        setStatus('success');

        // Store profile data for the wizard
        localStorage.setItem('linkedin_profile', JSON.stringify(data));
        
        // Redirect back to onboarding wizard (Step 4)
        setTimeout(() => {
          router.push(`/onboarding?token=${state}&linkedin=success`);
        }, 2000);

      } catch (error: any) {
        console.error('LinkedIn callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Error al procesar tu perfil de LinkedIn');
        
        // Redirect back to Step 3 to retry
        setTimeout(() => {
          router.push(`/onboarding?token=${state}&linkedin=error`);
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Procesando</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="flex flex-col gap-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span>Conectando con LinkedIn</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  <span>Extrayendo información con IA</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Generando tu perfil profesional</span>
                </div>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Éxito!</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              {profileData && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 text-left">
                  <p className="text-sm text-gray-600 mb-2">Datos extraídos:</p>
                  <ul className="text-sm space-y-1">
                    {profileData.full_name && <li>✓ Nombre completo</li>}
                    {profileData.headline && <li>✓ Headline profesional</li>}
                    {profileData.bio && <li>✓ Bio personalizada generada por IA</li>}
                    {profileData.skills?.length > 0 && <li>✓ {profileData.skills.length} skills identificadas</li>}
                  </ul>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-4">Redirigiendo...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-red-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">Redirigiendo para reintentar...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LinkedInCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <LinkedInCallbackContent />
    </Suspense>
  );
}
