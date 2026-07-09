'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { configStyles } from '../configuration/components/styles';
import { apiFetch } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

// ============================================================================
// TYPES
// ============================================================================
type TabId = 'profile' | 'security' | 'account';

interface Tab {
  id: TabId;
  label: string;
  icon: JSX.Element;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  company_id: string | null;
  position: string;
  department: string;
  avatar_url: string;
  phone: string;
  is_onboarded: boolean;
  is_account_activated: boolean;
  view_permissions: string[];
  totp_enabled: boolean;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Admin",
  inspiratoria_admin: "Admin Inspiratoria",
  admin: "Administrador",
  admin_root: "Admin Root",
  coordinator: "Coordinador",
  facilitator_internal: "Facilitador Interno",
  facilitator_inspiratoria: "Facilitador Inspiratoria",
  mentor: "Mentor",
  mentee: "Mentee",
  client: "Cliente",
};

const PERMISSION_LABELS: Record<string, string> = {
  dashboard: "Vista General",
  accounts: "Cuentas Studio",
  programs: "Programas Studio",
  billing: "Facturación",
  users: "Usuarios",
  analytics: "Analytics",
  ecosystem: "Ecosistema",
  chat: "Mensajes",
  goals: "Objetivos",
  configuration: "Configuración",
};

// ============================================================================
// ICONS
// ============================================================================
const IconUser = (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);
const IconShield = (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
);
const IconAccount = (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
);
const IconCamera = (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);
const IconLock = (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
);

// ============================================================================
// COMPONENT
// ============================================================================
export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  // Editable fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TOTP state
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

  const getToken = () => {
    if (typeof window !== 'undefined') return localStorage.getItem('auth_token') || '';
    return '';
  };

  // ── Fetch profile ──
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API}/api/companies/auth/profile`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setPosition(data.position || '');
        setDepartment(data.department || '');
        setTotpEnabled(data.totp_enabled || false);
        setTotpLoading(false);
      }
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Save profile ──
  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMsg('');
    setSaveError('');
    try {
      const res = await apiFetch(`${API}/api/companies/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ full_name: fullName, phone, position, department }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => prev ? { ...prev, ...data } : prev);
        // Update localStorage user
        try {
          const stored = JSON.parse(localStorage.getItem('user') || '{}');
          stored.full_name = data.full_name;
          stored.position = data.position;
          stored.department = data.department;
          localStorage.setItem('user', JSON.stringify(stored));
        } catch {}
        setSaveMsg('Perfil actualizado correctamente');
        setTimeout(() => setSaveMsg(''), 3000);
      } else {
        const err = await res.json();
        setSaveError(err.detail || 'Error al guardar');
      }
    } catch { setSaveError('Error de conexión'); }
    finally { setSaving(false); }
  };

  // ── Avatar upload ──
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setSaveError('La imagen no debe superar 2 MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setSaveError('Formato no soportado. Usa JPG, PNG o WebP');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    setSaveError('');
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      const res = await apiFetch(`${API}/api/companies/auth/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => prev ? { ...prev, avatar_url: data.avatar_url } : prev);
        setAvatarFile(null);
        setAvatarPreview(null);
        setSaveMsg('Foto de perfil actualizada');
        // Update localStorage and notify sidebar
        try {
          const stored = JSON.parse(localStorage.getItem('user') || '{}');
          stored.avatar_url = data.avatar_url;
          localStorage.setItem('user', JSON.stringify(stored));
          window.dispatchEvent(new Event('avatarUpdated'));
        } catch {}
        setTimeout(() => setSaveMsg(''), 3000);
      } else {
        const err = await res.json();
        setSaveError(err.detail || 'Error al subir imagen');
      }
    } catch { setSaveError('Error de conexión'); }
    finally { setUploadingAvatar(false); }
  };

  const handleRemoveAvatar = async () => {
    setSaveError('');
    try {
      const res = await apiFetch(`${API}/api/companies/auth/avatar`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setProfile((prev) => prev ? { ...prev, avatar_url: '' } : prev);
        setAvatarPreview(null);
        setAvatarFile(null);
        setSaveMsg('Foto de perfil eliminada');
        try {
          const stored = JSON.parse(localStorage.getItem('user') || '{}');
          stored.avatar_url = '';
          localStorage.setItem('user', JSON.stringify(stored));
          window.dispatchEvent(new Event('avatarUpdated'));
        } catch {}
        setTimeout(() => setSaveMsg(''), 3000);
      }
    } catch { setSaveError('Error de conexión'); }
  };

  // ── TOTP handlers ──
  const handleSetupTotp = async () => {
    setTotpError('');
    setTotpSuccess('');
    setShowSetup(true);
    try {
      const res = await apiFetch(`${API}/api/companies/auth/totp/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
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
    if (verifyCode.length !== 6) { setTotpError('Ingresa el código de 6 dígitos'); return; }
    setTotpError('');
    try {
      const res = await apiFetch(`${API}/api/companies/auth/totp/enable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ code: verifyCode }),
      });
      if (res.ok) {
        setTotpEnabled(true);
        setQrData(null);
        setSetupSecret(null);
        setVerifyCode('');
        setTotpError('');
        setTotpSuccess('✓ Autenticador activado correctamente');
        setTimeout(() => { setShowSetup(false); setTimeout(() => setTotpSuccess(''), 4000); }, 1500);
      } else {
        const data = await res.json();
        setTotpError(data.detail || 'Código incorrecto');
      }
    } catch { setTotpError('Error de conexión'); }
  };

  const handleDisableTotp = async () => {
    if (disableCode.length !== 6) { setTotpError('Ingresa el código de 6 dígitos para desactivar'); return; }
    setTotpError('');
    try {
      const res = await apiFetch(`${API}/api/companies/auth/totp/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ code: disableCode }),
      });
      if (res.ok) {
        setTotpEnabled(false);
        setDisableCode('');
        setTotpError('');
        setTotpSuccess('✓ Autenticador desactivado correctamente');
        setTimeout(() => { setShowDisable(false); setTimeout(() => setTotpSuccess(''), 4000); }, 1500);
      } else {
        const data = await res.json();
        setTotpError(data.detail || 'Código incorrecto');
      }
    } catch { setTotpError('Error de conexión'); }
  };

  // ── Modal styles ──
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

  // ── Tabs ──
  const tabs: Tab[] = [
    { id: 'profile', label: 'Perfil', icon: IconUser },
    { id: 'security', label: 'Seguridad', icon: IconShield },
    { id: 'account', label: 'Cuenta', icon: IconAccount },
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  // ── Loading state ──
  if (loading) {
    return (
      <>
        <style>{configStyles}</style>
        <div className="config-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#6b7280', fontSize: '0.875rem' }}>
            Cargando perfil...
          </div>
        </div>
      </>
    );
  }

  // ==========================================
  // RENDER: PROFILE TAB
  // ==========================================
  const renderProfileSection = () => (
    <>
      {/* Avatar section */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">
            {IconCamera}
            Foto de Perfil
          </div>
        </div>
        <div className="section-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Avatar preview */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '5rem', height: '5rem', borderRadius: '1rem',
                background: (avatarPreview || profile?.avatar_url)
                  ? `url(${avatarPreview || (profile?.avatar_url?.startsWith('/') ? API + profile.avatar_url : profile?.avatar_url)}) center/cover`
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: '1.5rem',
                border: '3px solid #e5e7eb', overflow: 'hidden',
              }}>
                {!(avatarPreview || profile?.avatar_url) && getInitials(profile?.full_name || profile?.email || '?')}
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleAvatarSelect}
                />
                <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                  {IconCamera}
                  {avatarFile ? 'Cambiar imagen' : 'Subir foto'}
                </button>
                {avatarFile && (
                  <button className="btn-primary" onClick={handleAvatarUpload} disabled={uploadingAvatar}>
                    {uploadingAvatar ? 'Subiendo...' : 'Guardar foto'}
                  </button>
                )}
                {(profile?.avatar_url && !avatarFile) && (
                  <button className="btn-outline" onClick={handleRemoveAvatar}>Eliminar</button>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>JPG, PNG o WebP. Máximo 2 MB.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">
            {IconUser}
            Información Personal
          </div>
        </div>
        <div className="section-body">
          <div className="input-row">
            <div className="input-group">
              <label className="input-label">Nombre completo</label>
              <input className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre completo" />
            </div>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input className="input-field" value={profile?.email || ''} disabled />
            </div>
          </div>
          <div className="input-row">
            <div className="input-group">
              <label className="input-label">Teléfono</label>
              <input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+56 9 1234 5678" />
            </div>
            <div className="input-group">
              <label className="input-label">Cargo</label>
              <input className="input-field" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Ej: Director de Innovación" />
            </div>
          </div>
          <div className="input-row">
            <div className="input-group">
              <label className="input-label">Departamento</label>
              <input className="input-field" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Ej: Recursos Humanos" />
            </div>
            <div className="input-group">
              <label className="input-label">Rol</label>
              <input className="input-field" value={ROLE_LABELS[profile?.role || ''] || profile?.role || ''} disabled />
            </div>
          </div>

          {/* Save button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <button className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {saveMsg && (
              <span style={{ fontSize: '0.8rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                {saveMsg}
              </span>
            )}
            {saveError && (
              <span style={{ fontSize: '0.8rem', color: '#dc2626' }}>{saveError}</span>
            )}
          </div>
        </div>
      </div>
    </>
  );

  // ==========================================
  // RENDER: SECURITY TAB
  // ==========================================
  const renderSecuritySection = () => (
    <>
      {/* TOTP Setup Modal */}
      {showSetup && (qrData || totpSuccess) && (
        <div style={backdropStyle} onClick={() => { if (!totpSuccess) { setShowSetup(false); setQrData(null); setSetupSecret(null); setVerifyCode(''); setTotpError(''); } }}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            {totpSuccess && !qrData && (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: '#111', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <svg width="24" height="24" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#111' }}>Autenticador activado</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Tu cuenta ahora tiene doble factor de autenticación</p>
              </div>
            )}
            {qrData && (<>
              <button onClick={() => { setShowSetup(false); setQrData(null); setSetupSecret(null); setVerifyCode(''); setTotpError(''); }} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '1.25rem', lineHeight: 1 }}>✕</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111' }}>Configurar Autenticador</h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#666' }}>Vincula tu app para mayor seguridad</p>
                </div>
              </div>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '0.75rem', display: 'inline-block', border: '1px solid #e5e5e5' }}>
                  <img src={`data:image/png;base64,${qrData}`} alt="QR Code" style={{ width: 180, height: 180, display: 'block' }} />
                </div>
                <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#999' }}>Escanea con Google Authenticator o Microsoft Authenticator</p>
              </div>
              <ol style={{ margin: '0 0 1rem 0', paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#444', lineHeight: 2 }}>
                <li>Abre <strong>Google Authenticator</strong> o <strong>Microsoft Authenticator</strong></li>
                <li>Escanea el código QR de arriba</li>
                <li>Ingresa el código de 6 dígitos que genera</li>
              </ol>
              {setupSecret && (
                <div style={{ padding: '0.6rem 0.85rem', background: '#f5f5f5', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#666', marginBottom: '1rem', border: '1px solid #e5e5e5' }}>
                  <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#999' }}>Clave manual</span>
                  <code style={{ color: '#111', letterSpacing: '0.12em', fontWeight: 600, wordBreak: 'break-all', fontSize: '0.85rem' }}>{setupSecret}</code>
                </div>
              )}
              {totpError && (
                <div style={{ padding: '0.5rem 0.75rem', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '0.5rem', color: '#333', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{totpError}</div>
              )}
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Código de verificación</label>
              <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.78rem', color: '#555', lineHeight: 1.5 }}>Ingresa el código de 6 dígitos generado por tu autenticador</p>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <input type="text" inputMode="numeric" maxLength={6} autoFocus placeholder="000000" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))} style={{ width: '9rem', padding: '0.65rem 1rem', background: '#fff', border: verifyCode.length === 6 ? '2px solid #111' : '2px solid #ddd', borderRadius: '0.5rem', color: '#111', fontSize: '1.3rem', letterSpacing: '0.35em', textAlign: 'center', fontWeight: 700, transition: 'border-color 0.2s', outline: 'none' }} />
                  {verifyCode.length > 0 && verifyCode.length < 6 && (
                    <span style={{ position: 'absolute', right: '-2rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', color: '#999' }}>{verifyCode.length}/6</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowSetup(false); setQrData(null); setSetupSecret(null); setVerifyCode(''); setTotpError(''); }} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 500, background: '#fff', border: '1px solid #ddd', color: '#666', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleEnableTotp} disabled={verifyCode.length !== 6} style={{ padding: '0.6rem 1.5rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600, background: verifyCode.length === 6 ? '#111' : '#ccc', border: 'none', color: '#fff', cursor: verifyCode.length === 6 ? 'pointer' : 'not-allowed' }}>Verificar y Activar</button>
              </div>
            </>)}
          </div>
        </div>
      )}

      {/* TOTP Disable Modal */}
      {showDisable && (
        <div style={backdropStyle} onClick={() => { if (!totpSuccess) { setShowDisable(false); setDisableCode(''); setTotpError(''); } }}>
          <div style={{ ...modalStyle, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            {totpSuccess && (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: '#111', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <svg width="24" height="24" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#111' }}>Autenticador desactivado</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Tu cuenta queda protegida solo por OTP email</p>
              </div>
            )}
            {!totpSuccess && (<>
              <button onClick={() => { setShowDisable(false); setDisableCode(''); setTotpError(''); }} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '1.25rem', lineHeight: 1 }}>✕</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111' }}>Desactivar Autenticador</h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#666' }}>Tu cuenta quedará protegida solo por OTP email</p>
                </div>
              </div>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#444', lineHeight: 1.6 }}>Abre tu app autenticadora e ingresa el código actual de 6 dígitos para confirmar la desactivación.</p>
              {totpError && (
                <div style={{ padding: '0.5rem 0.75rem', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '0.5rem', color: '#333', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{totpError}</div>
              )}
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Código de verificación</label>
              <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.78rem', color: '#555', lineHeight: 1.5 }}>Ingresa el código de 6 dígitos generado por tu autenticador</p>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <input type="text" inputMode="numeric" maxLength={6} autoFocus placeholder="000000" value={disableCode} onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))} style={{ width: '9rem', padding: '0.65rem 1rem', background: '#fff', border: disableCode.length === 6 ? '2px solid #111' : '2px solid #ddd', borderRadius: '0.5rem', color: '#111', fontSize: '1.3rem', letterSpacing: '0.35em', textAlign: 'center', fontWeight: 700, transition: 'border-color 0.2s', outline: 'none' }} />
                {disableCode.length > 0 && disableCode.length < 6 && (
                  <span style={{ position: 'absolute', right: '-2rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', color: '#999' }}>{disableCode.length}/6</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowDisable(false); setDisableCode(''); setTotpError(''); }} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 500, background: '#fff', border: '1px solid #ddd', color: '#666', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleDisableTotp} disabled={disableCode.length !== 6} style={{ padding: '0.6rem 1.5rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600, background: disableCode.length === 6 ? '#111' : '#ccc', border: 'none', color: '#fff', cursor: disableCode.length === 6 ? 'pointer' : 'not-allowed' }}>Desactivar 2FA</button>
              </div>
            </>)}
          </div>
        </div>
      )}

      {/* Authenticator section */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">
            {IconShield}
            Autenticación con App
          </div>
        </div>
        <div className="section-body">
          <div className="setting-row">
            <div className="setting-row-info">
              <div className="setting-row-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Autenticador (Google / Microsoft)</span>
                {totpLoading ? (
                  <span style={{ fontSize: '0.7rem', color: '#6b7280', fontStyle: 'italic' }}>verificando...</span>
                ) : totpEnabled ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#d1fae5', color: '#065f46', padding: '0.15rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, border: '1px solid #6ee7b7' }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    Activo
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#f3f4f6', color: '#6b7280', padding: '0.15rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, border: '1px solid #e5e7eb' }}>
                    No configurado
                  </span>
                )}
              </div>
              <div className="setting-row-desc">
                {totpEnabled
                  ? `Vinculado a ${profile?.email}. Al iniciar sesión se te pedirá el código de tu app autenticadora.`
                  : 'Agrega una capa extra de seguridad usando Google Authenticator o Microsoft Authenticator.'}
              </div>
            </div>
            <div>
              {!totpLoading && !totpEnabled && (
                <button className="btn-secondary" onClick={handleSetupTotp} style={{ whiteSpace: 'nowrap' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
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
          {totpSuccess && (
            <div style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '0.5rem', color: '#065f46', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {totpSuccess}
            </div>
          )}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: totpEnabled ? 1 : 0.5 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="#4285F4"/><path d="M12 2L2 7l10 5 10-5L12 2z" fill="#34A853"/><path d="M2 7v10l10 5V12L2 7z" fill="#FBBC05"/><path d="M22 7L12 12v10l10-5V7z" fill="#EA4335"/></svg>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Google</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: totpEnabled ? 1 : 0.5 }}>
              <svg width="20" height="20" viewBox="0 0 23 23"><rect width="11" height="11" fill="#0078D4"/><rect x="12" width="11" height="11" fill="#0078D4"/><rect y="12" width="11" height="11" fill="#0078D4"/><rect x="12" y="12" width="11" height="11" fill="#0078D4" opacity="0.5"/></svg>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Microsoft</span>
            </div>
          </div>
        </div>
      </div>

      {/* Login method */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">
            {IconLock}
            Método de Inicio de Sesión
          </div>
        </div>
        <div className="section-body">
          <div className="setting-row">
            <div className="setting-row-info">
              <div className="setting-row-label">OTP por Email</div>
              <div className="setting-row-desc">Cada vez que inicias sesión recibes un código de un solo uso en tu email</div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#d1fae5', color: '#065f46', padding: '0.15rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, border: '1px solid #6ee7b7' }}>
              Siempre activo
            </span>
          </div>
          <div className="setting-row">
            <div className="setting-row-info">
              <div className="setting-row-label">Autenticador 2FA</div>
              <div className="setting-row-desc">Capa adicional de seguridad con app autenticadora</div>
            </div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              background: totpEnabled ? '#d1fae5' : '#f3f4f6',
              color: totpEnabled ? '#065f46' : '#6b7280',
              padding: '0.15rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600,
              border: `1px solid ${totpEnabled ? '#6ee7b7' : '#e5e7eb'}`,
            }}>
              {totpEnabled ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>
    </>
  );

  // ==========================================
  // RENDER: ACCOUNT TAB
  // ==========================================
  const renderAccountSection = () => (
    <>
      {/* Account type */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">
            {IconAccount}
            Información de Cuenta
          </div>
        </div>
        <div className="section-body">
          <div className="setting-row">
            <div className="setting-row-info">
              <div className="setting-row-label">Tipo de cuenta</div>
              <div className="setting-row-desc">El rol es asignado por el administrador del sistema</div>
            </div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.75rem',
              background: '#f3f4f6', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600, color: '#374151',
              border: '1px solid #e5e7eb',
            }}>
              {ROLE_LABELS[profile?.role || ''] || profile?.role}
            </span>
          </div>
          <div className="setting-row">
            <div className="setting-row-info">
              <div className="setting-row-label">Estado de la cuenta</div>
              <div className="setting-row-desc">Indica si la cuenta fue activada y verificada</div>
            </div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.6rem',
              background: profile?.is_account_activated ? '#d1fae5' : '#fef3c7',
              color: profile?.is_account_activated ? '#065f46' : '#92400e',
              borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600,
              border: `1px solid ${profile?.is_account_activated ? '#6ee7b7' : '#fcd34d'}`,
            }}>
              {profile?.is_account_activated ? 'Activada' : 'Pendiente de activación'}
            </span>
          </div>
          <div className="setting-row">
            <div className="setting-row-info">
              <div className="setting-row-label">Onboarding</div>
              <div className="setting-row-desc">Proceso de configuración inicial completado</div>
            </div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.6rem',
              background: profile?.is_onboarded ? '#d1fae5' : '#f3f4f6',
              color: profile?.is_onboarded ? '#065f46' : '#6b7280',
              borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600,
              border: `1px solid ${profile?.is_onboarded ? '#6ee7b7' : '#e5e7eb'}`,
            }}>
              {profile?.is_onboarded ? 'Completado' : 'Pendiente'}
            </span>
          </div>
          <div className="setting-row">
            <div className="setting-row-info">
              <div className="setting-row-label">ID de usuario</div>
              <div className="setting-row-desc">Identificador único de tu cuenta</div>
            </div>
            <code style={{ fontSize: '0.75rem', color: '#6b7280', background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>{profile?.id}</code>
          </div>
          {profile?.created_at && (
            <div className="setting-row">
              <div className="setting-row-info">
                <div className="setting-row-label">Miembro desde</div>
                <div className="setting-row-desc">Fecha de creación de tu cuenta</div>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#374151' }}>
                {new Date(profile.created_at).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Permissions */}
      {profile?.view_permissions && profile.view_permissions.length > 0 && (
        <div className="section">
          <div className="section-header">
            <div className="section-title">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              Permisos de Vista
            </div>
          </div>
          <div className="section-body">
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '1rem', marginTop: 0 }}>
              Los permisos son asignados por el administrador. Contacta al admin para solicitar cambios.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {profile.view_permissions.map((perm) => (
                <span key={perm} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.3rem 0.75rem', background: '#f3f4f6', borderRadius: '0.5rem',
                  fontSize: '0.8rem', color: '#374151', border: '1px solid #e5e7eb',
                }}>
                  <svg width="12" height="12" fill="none" stroke="#059669" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  {PERMISSION_LABELS[perm] || perm}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MFA Summary */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">
            {IconShield}
            Resumen de Seguridad
          </div>
        </div>
        <div className="section-body">
          <div className="setting-row">
            <div className="setting-row-info">
              <div className="setting-row-label">OTP por Email</div>
              <div className="setting-row-desc">El método de autenticación principal</div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#d1fae5', color: '#065f46', padding: '0.15rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, border: '1px solid #6ee7b7' }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              Activo
            </span>
          </div>
          <div className="setting-row">
            <div className="setting-row-info">
              <div className="setting-row-label">Autenticador 2FA</div>
              <div className="setting-row-desc">Segundo factor de autenticación con app</div>
            </div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              background: totpEnabled ? '#d1fae5' : '#fef3c7',
              color: totpEnabled ? '#065f46' : '#92400e',
              padding: '0.15rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600,
              border: `1px solid ${totpEnabled ? '#6ee7b7' : '#fcd34d'}`,
            }}>
              {totpEnabled ? (
                <><svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Activo</>
              ) : 'No configurado'}
            </span>
          </div>
        </div>
      </div>
    </>
  );

  // ==========================================
  // RENDER
  // ==========================================
  const renderSection = () => {
    switch (activeTab) {
      case 'profile': return renderProfileSection();
      case 'security': return renderSecuritySection();
      case 'account': return renderAccountSection();
      default: return null;
    }
  };

  return (
    <>
      <style>{configStyles}</style>
      <div className="config-container">
        {/* Header */}
        <div className="config-header">
          <h1 className="config-title">Mi Configuración</h1>
          <p className="config-subtitle">Gestiona tu perfil, seguridad y preferencias de cuenta.</p>
        </div>

        {/* Tabs */}
        <div className="config-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`config-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {renderSection()}
      </div>
    </>
  );
}
