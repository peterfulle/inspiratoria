'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icons } from '../components/Icons';
import Toggle from '../components/Toggle';

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface SecuritySectionProps {
  settings: {
    twoFactorAuth: boolean;
    sessionTimeout: string;
    passwordExpiry: boolean;
    ipWhitelist: boolean;
    autoBackup: boolean;
  };
  onSettingsChange: (settings: any) => void;
}

export default function SecuritySection({ settings, onSettingsChange }: SecuritySectionProps) {
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpLoading, setTotpLoading] = useState(true);
  const [qrData, setQrData] = useState<string | null>(null);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [totpError, setTotpError] = useState('');
  const [totpSuccess, setTotpSuccess] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const getToken = () => {
    if (typeof window !== 'undefined') return localStorage.getItem('auth_token') || '';
    return '';
  };

  const checkTotpStatus = useCallback(async () => {
    setTotpLoading(true);
    try {
      const stored = localStorage.getItem('user');
      if (!stored) return;
      const user = JSON.parse(stored);
      setUserEmail(user.email || '');

      const res = await fetch(`${API}/api/companies/auth/totp/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      if (res.ok) {
        const data = await res.json();
        setTotpEnabled(data.totp_enabled);
      }
    } catch { /* silently fail */ }
    finally { setTotpLoading(false); }
  }, []);

  useEffect(() => { checkTotpStatus(); }, [checkTotpStatus]);

  const handleSetupTotp = async () => {
    setTotpError('');
    setTotpSuccess('');
    setShowSetup(true);
    try {
      const res = await fetch(`${API}/api/companies/auth/totp/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setQrData(data.qr_code);
        setSetupSecret(data.secret);
      } else {
        const data = await res.json();
        setTotpError(data.detail || 'Error al generar QR');
        setShowSetup(false);
      }
    } catch {
      setTotpError('Error de conexión');
      setShowSetup(false);
    }
  };

  const handleEnableTotp = async () => {
    if (verifyCode.length !== 6) {
      setTotpError('Ingresa el código de 6 dígitos');
      return;
    }
    setTotpError('');
    try {
      const res = await fetch(`${API}/api/companies/auth/totp/enable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ code: verifyCode }),
      });
      if (res.ok) {
        setTotpEnabled(true);
        setQrData(null);
        setSetupSecret(null);
        setVerifyCode('');
        setTotpError('');
        setTotpSuccess('✓ Autenticador activado correctamente');
        setTimeout(() => {
          setShowSetup(false);
          setTimeout(() => setTotpSuccess(''), 4000);
        }, 1500);
      } else {
        const data = await res.json();
        setTotpError(data.detail || 'Código incorrecto');
      }
    } catch { setTotpError('Error de conexión'); }
  };

  const handleDisableTotp = async () => {
    if (disableCode.length !== 6) {
      setTotpError('Ingresa el código de 6 dígitos para desactivar');
      return;
    }
    setTotpError('');
    try {
      const res = await fetch(`${API}/api/companies/auth/totp/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ code: disableCode }),
      });
      if (res.ok) {
        setTotpEnabled(false);
        setDisableCode('');
        setTotpError('');
        setTotpSuccess('✓ Autenticador desactivado correctamente');
        setTimeout(() => {
          setShowDisable(false);
          setTimeout(() => setTotpSuccess(''), 4000);
        }, 1500);
      } else {
        const data = await res.json();
        setTotpError(data.detail || 'Código incorrecto');
      }
    } catch { setTotpError('Error de conexión'); }
  };

  const handleToggle = (key: keyof typeof settings) => {
    onSettingsChange({ ...settings, [key]: !settings[key] });
  };

  /* ── Modal backdrop style ── */
  const backdropStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  const modalStyle: React.CSSProperties = {
    background: '#ffffff', borderRadius: '1rem', width: '100%', maxWidth: 480,
    padding: '2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
    position: 'relative', color: '#111',
  };

  return (
    <>
      {/* ===== SETUP MODAL ===== */}
      {showSetup && (qrData || totpSuccess) && (
        <div style={backdropStyle} onClick={() => { if (!totpSuccess) { setShowSetup(false); setQrData(null); setSetupSecret(null); setVerifyCode(''); setTotpError(''); } }}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>

            {/* Success overlay */}
            {totpSuccess && !qrData && (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: '#111', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <svg width="24" height="24" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#111' }}>Autenticador activado</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Tu cuenta ahora tiene doble factor de autenticación</p>
              </div>
            )}

            {/* Normal content */}
            {qrData && (<>
            {/* Close */}
            <button
              onClick={() => { setShowSetup(false); setQrData(null); setSetupSecret(null); setVerifyCode(''); setTotpError(''); }}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '1.25rem', lineHeight: 1 }}
            >✕</button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111' }}>Configurar Autenticador</h3>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#666' }}>Vincula tu app para mayor seguridad</p>
              </div>
            </div>

            {/* QR */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '0.75rem', display: 'inline-block', border: '1px solid #e5e5e5' }}>
                <img src={`data:image/png;base64,${qrData}`} alt="QR Code" style={{ width: 180, height: 180, display: 'block' }} />
              </div>
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#999' }}>Escanea con Google Authenticator o Microsoft Authenticator</p>
            </div>

            {/* Steps */}
            <ol style={{ margin: '0 0 1rem 0', paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#444', lineHeight: 2 }}>
              <li>Abre <strong>Google Authenticator</strong> o <strong>Microsoft Authenticator</strong></li>
              <li>Escanea el código QR de arriba</li>
              <li>Ingresa el código de 6 dígitos que genera</li>
            </ol>

            {/* Manual key */}
            {setupSecret && (
              <div style={{ padding: '0.6rem 0.85rem', background: '#f5f5f5', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#666', marginBottom: '1rem', border: '1px solid #e5e5e5' }}>
                <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#999' }}>Clave manual</span>
                <code style={{ color: '#111', letterSpacing: '0.12em', fontWeight: 600, wordBreak: 'break-all', fontSize: '0.85rem' }}>{setupSecret}</code>
              </div>
            )}

            {/* Error inside modal */}
            {totpError && (
              <div style={{ padding: '0.5rem 0.75rem', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '0.5rem', color: '#333', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                {totpError}
              </div>
            )}

            {/* Code input */}
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              Código de verificación
            </label>
            <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.78rem', color: '#555', lineHeight: 1.5 }}>
              Ingresa el código de 6 dígitos generado por tu autenticador
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{
                    width: '9rem', padding: '0.65rem 1rem', background: '#fff',
                    border: verifyCode.length === 6 ? '2px solid #111' : '2px solid #ddd',
                    borderRadius: '0.5rem', color: '#111',
                    fontSize: '1.3rem', letterSpacing: '0.35em', textAlign: 'center', fontWeight: 700,
                    transition: 'border-color 0.2s', outline: 'none',
                  }}
                />
                {verifyCode.length > 0 && verifyCode.length < 6 && (
                  <span style={{ position: 'absolute', right: '-2rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', color: '#999' }}>{verifyCode.length}/6</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowSetup(false); setQrData(null); setSetupSecret(null); setVerifyCode(''); setTotpError(''); }}
                style={{
                  padding: '0.6rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 500,
                  background: '#fff', border: '1px solid #ddd', color: '#666', cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
              >Cancelar</button>
              <button
                onClick={handleEnableTotp}
                disabled={verifyCode.length !== 6}
                style={{
                  padding: '0.6rem 1.5rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600,
                  background: verifyCode.length === 6 ? '#111' : '#ccc',
                  border: 'none', color: '#fff',
                  cursor: verifyCode.length === 6 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                }}
              >Verificar y Activar</button>
            </div>
            </>)}
          </div>
        </div>
      )}

      {/* ===== DISABLE MODAL ===== */}
      {showDisable && (
        <div style={backdropStyle} onClick={() => { if (!totpSuccess) { setShowDisable(false); setDisableCode(''); setTotpError(''); } }}>
          <div style={{ ...modalStyle, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>

            {/* Success overlay */}
            {totpSuccess && (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: '#111', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <svg width="24" height="24" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#111' }}>Autenticador desactivado</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Tu cuenta queda protegida solo por OTP email</p>
              </div>
            )}

            {/* Normal content */}
            {!totpSuccess && (<>
            {/* Close */}
            <button
              onClick={() => { setShowDisable(false); setDisableCode(''); setTotpError(''); }}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '1.25rem', lineHeight: 1 }}
            >✕</button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111' }}>Desactivar Autenticador</h3>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#666' }}>Tu cuenta quedará protegida solo por OTP email</p>
              </div>
            </div>

            <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#444', lineHeight: 1.6 }}>
              Abre tu app autenticadora e ingresa el código actual de 6 dígitos para confirmar la desactivación.
            </p>

            {/* Error inside modal */}
            {totpError && (
              <div style={{ padding: '0.5rem 0.75rem', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '0.5rem', color: '#333', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                {totpError}
              </div>
            )}

            {/* Code input */}
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              Código de verificación
            </label>
            <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.78rem', color: '#555', lineHeight: 1.5 }}>
              Ingresa el código de 6 dígitos generado por tu autenticador
            </p>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                placeholder="000000"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{
                  width: '9rem', padding: '0.65rem 1rem', background: '#fff',
                  border: disableCode.length === 6 ? '2px solid #111' : '2px solid #ddd',
                  borderRadius: '0.5rem', color: '#111',
                  fontSize: '1.3rem', letterSpacing: '0.35em', textAlign: 'center', fontWeight: 700,
                  transition: 'border-color 0.2s', outline: 'none',
                }}
              />
              {disableCode.length > 0 && disableCode.length < 6 && (
                <span style={{ position: 'absolute', right: '-2rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', color: '#999' }}>{disableCode.length}/6</span>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowDisable(false); setDisableCode(''); setTotpError(''); }}
                style={{
                  padding: '0.6rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 500,
                  background: '#fff', border: '1px solid #ddd', color: '#666', cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
              >Cancelar</button>
              <button
                onClick={handleDisableTotp}
                disabled={disableCode.length !== 6}
                style={{
                  padding: '0.6rem 1.5rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600,
                  background: disableCode.length === 6 ? '#111' : '#ccc',
                  border: 'none', color: '#fff',
                  cursor: disableCode.length === 6 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                }}
              >Desactivar 2FA</button>
            </div>
            </>)}
          </div>
        </div>
      )}

      {/* ===== AUTHENTICATOR APP SECTION ===== */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">
            {Icons.shield}
            Autenticación con App
          </div>
        </div>
        <div className="section-body">
          {/* Status row */}
          <div className="setting-row">
            <div className="setting-row-info">
              <div className="setting-row-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Autenticador (Google / Microsoft)</span>
                {totpLoading ? (
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>verificando...</span>
                ) : totpEnabled ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                    background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '0.15rem 0.6rem',
                    borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)',
                  }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    Activo
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                    background: 'rgba(148,163,184,0.1)', color: '#94a3b8', padding: '0.15rem 0.6rem',
                    borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, border: '1px solid rgba(148,163,184,0.15)',
                  }}>
                    No configurado
                  </span>
                )}
              </div>
              <div className="setting-row-desc">
                {totpEnabled
                  ? `Vinculado a ${userEmail}. Al iniciar sesión se te pedirá el código de tu app autenticadora.`
                  : 'Agrega una capa extra de seguridad usando Google Authenticator o Microsoft Authenticator.'}
              </div>
            </div>
            <div>
              {!totpLoading && !totpEnabled && (
                <button className="btn-secondary" onClick={handleSetupTotp} style={{ whiteSpace: 'nowrap' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                  Activar
                </button>
              )}
              {!totpLoading && totpEnabled && (
                <button className="btn-outline" onClick={() => { setShowDisable(true); setTotpError(''); setDisableCode(''); }} style={{ whiteSpace: 'nowrap' }}>
                  Desactivar
                </button>
              )}
            </div>
          </div>

          {/* Success message (inline) */}
          {totpSuccess && (
            <div style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.5rem', color: '#e2e8f0', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {totpSuccess}
            </div>
          )}

          {/* App logos */}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: totpEnabled ? 1 : 0.5 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="#4285F4"/><path d="M12 2L2 7l10 5 10-5L12 2z" fill="#34A853"/><path d="M2 7v10l10 5V12L2 7z" fill="#FBBC05"/><path d="M22 7L12 12v10l10-5V7z" fill="#EA4335"/></svg>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Google</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: totpEnabled ? 1 : 0.5 }}>
              <svg width="20" height="20" viewBox="0 0 23 23"><rect width="11" height="11" fill="#0078D4"/><rect x="12" width="11" height="11" fill="#0078D4"/><rect y="12" width="11" height="11" fill="#0078D4"/><rect x="12" y="12" width="11" height="11" fill="#0078D4" opacity="0.5"/></svg>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Microsoft</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== SESSION / OTHER SECURITY ===== */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">
            {Icons.lock}
            Sesiones y Acceso
          </div>
        </div>
        <div className="section-body">
          <div className="setting-row">
            <div className="setting-row-info">
              <div className="setting-row-label">Tiempo de Expiración de Sesión</div>
              <div className="setting-row-desc">Cerrar sesión automáticamente después de inactividad</div>
            </div>
            <select 
              className="select-field" 
              style={{ width: '10rem' }}
              value={settings.sessionTimeout}
              onChange={(e) => onSettingsChange({ ...settings, sessionTimeout: e.target.value })}
            >
              <option value="30m">30 minutos</option>
              <option value="1h">1 hora</option>
              <option value="4h">4 horas</option>
              <option value="24h">24 horas</option>
              <option value="never">Nunca</option>
            </select>
          </div>
          <div className="setting-row">
            <div className="setting-row-info">
              <div className="setting-row-label">Lista Blanca de IPs</div>
              <div className="setting-row-desc">Restringir acceso solo a IPs autorizadas</div>
            </div>
            <Toggle active={settings.ipWhitelist} onChange={() => handleToggle('ipWhitelist')} />
          </div>
          {settings.ipWhitelist && (
            <div style={{ marginTop: '0.75rem' }}>
              <label className="input-label">IPs Autorizadas (una por línea)</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="192.168.1.1&#10;10.0.0.0/24"
                style={{ resize: 'vertical' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ===== BACKUP ===== */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">
            {Icons.database}
            Respaldo de Datos
          </div>
        </div>
        <div className="section-body">
          <div className="setting-row">
            <div className="setting-row-info">
              <div className="setting-row-label">Backup Automático</div>
              <div className="setting-row-desc">Crear respaldo diario de la base de datos</div>
            </div>
            <Toggle active={settings.autoBackup} onChange={() => handleToggle('autoBackup')} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button className="btn-secondary">
              {Icons.refresh}
              Crear Backup Ahora
            </button>
            <button className="btn-outline">
              Ver Historial de Backups
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
