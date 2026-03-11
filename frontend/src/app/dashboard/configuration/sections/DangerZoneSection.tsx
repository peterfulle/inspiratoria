'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icons } from '../components/Icons';

export default function DangerZoneSection() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deletedCounts, setDeletedCounts] = useState<any>(null);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleDeleteAllData = async () => {
    if (confirmText !== 'ELIMINAR TODO' || countdown > 0) return;

    setLoading(true);
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
                        process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || 
                        'http://localhost:8001';
      
      const response = await fetch(`${backendUrl}/api/clear-all-data`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify(result.detail || result, null, 2));
      }

      setDeletedCounts(result.deleted);
      setSuccess(true);
      
      setTimeout(() => {
        localStorage.clear();
        router.push('/login');
      }, 3000);

    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error desconocido');
      setLoading(false);
    }
  };

  const isValid = confirmText === 'ELIMINAR TODO' && countdown === 0;

  return (
    <div className="danger-zone">
      <div className="section-header">
        <div className="section-title">
          {Icons.warning}
          Zona de Peligro
        </div>
      </div>
      <div className="section-body">
        {/* Success */}
        {success && (
          <div className="alert alert-success">
            <div className="alert-icon">{Icons.check}</div>
            <div className="alert-content">
              <div className="alert-title">Datos eliminados correctamente</div>
              <div className="alert-text">Cerrando sesión en 3 segundos...</div>
              {deletedCounts && (
                <div className="deleted-results">
                  {Object.entries(deletedCounts).map(([key, value]) => (
                    <div key={key} className="deleted-item">
                      <span className="deleted-item-label">{key}</span>
                      <span className="deleted-item-value">{typeof value === 'number' ? value : 'Error'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-error">
            <div className="alert-icon">{Icons.x}</div>
            <div className="alert-content">
              <div className="alert-title">Error</div>
              <div className="alert-text">{error}</div>
            </div>
          </div>
        )}

        {!success && (
          <>
            <div className="alert alert-warning">
              <div className="alert-icon">{Icons.warning}</div>
              <div className="alert-content">
                <div className="alert-title">Acción irreversible</div>
                <div className="alert-text">
                  Esta operación eliminará permanentemente todos los datos: empresas, programas, 
                  usuarios, matches, actividades, métricas y sesiones.
                </div>
              </div>
            </div>

            {countdown > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div className="countdown">{countdown}</div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Espera antes de continuar</p>
              </div>
            )}

            <div className="confirm-container">
              <label className="confirm-label">
                Escribe "ELIMINAR TODO" para confirmar:
              </label>
              <input
                type="text"
                className="input-field"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                disabled={loading || success || countdown > 0}
                placeholder="ELIMINAR TODO"
              />
              {confirmText && (
                <div className={`confirm-status ${isValid ? 'valid' : 'invalid'}`}>
                  {isValid ? (
                    <>{Icons.check} Confirmado</>
                  ) : (
                    <>{Icons.x} {countdown > 0 ? `Espera ${countdown}s` : 'Texto incorrecto'}</>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button 
                className="btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className="btn-danger"
                style={{ flex: 1 }}
                onClick={handleDeleteAllData}
                disabled={!isValid || loading}
              >
                {loading ? (
                  <>{Icons.refresh} Eliminando...</>
                ) : (
                  <>{Icons.trash} Eliminar Todo</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
