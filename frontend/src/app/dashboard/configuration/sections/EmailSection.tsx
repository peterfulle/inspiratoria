'use client';

import { Icons } from '../components/Icons';

interface EmailSectionProps {
  settings: {
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  };
  onSettingsChange: (settings: any) => void;
}

export default function EmailSection({ settings, onSettingsChange }: EmailSectionProps) {
  return (
    <>
      <div className="section">
        <div className="section-header">
          <div className="section-title">
            {Icons.mail}
            Configuración SMTP
          </div>
        </div>
        <div className="section-body">
          <div className="section-desc">
            Configura el servidor de correo para enviar notificaciones y emails transaccionales.
          </div>
          <div className="input-row">
            <div className="input-group">
              <label className="input-label">Servidor SMTP</label>
              <input
                type="text"
                className="input-field"
                value={settings.smtpHost}
                onChange={(e) => onSettingsChange({ ...settings, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Puerto</label>
              <input
                type="text"
                className="input-field"
                value={settings.smtpPort}
                onChange={(e) => onSettingsChange({ ...settings, smtpPort: e.target.value })}
                placeholder="587"
              />
            </div>
          </div>
          <div className="input-row">
            <div className="input-group">
              <label className="input-label">Usuario SMTP</label>
              <input
                type="text"
                className="input-field"
                value={settings.smtpUser}
                onChange={(e) => onSettingsChange({ ...settings, smtpUser: e.target.value })}
                placeholder="usuario@ejemplo.com"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Contraseña SMTP</label>
              <input
                type="password"
                className="input-field"
                value={settings.smtpPassword}
                onChange={(e) => onSettingsChange({ ...settings, smtpPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-title">
            {Icons.mail}
            Remitente por Defecto
          </div>
        </div>
        <div className="section-body">
          <div className="input-row">
            <div className="input-group">
              <label className="input-label">Email Remitente</label>
              <input
                type="email"
                className="input-field"
                value={settings.fromEmail}
                onChange={(e) => onSettingsChange({ ...settings, fromEmail: e.target.value })}
                placeholder="noreply@inspiratoria.com"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Nombre Remitente</label>
              <input
                type="text"
                className="input-field"
                value={settings.fromName}
                onChange={(e) => onSettingsChange({ ...settings, fromName: e.target.value })}
                placeholder="Inspiratoria"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button className="btn-secondary">
              Enviar Email de Prueba
            </button>
            <button className="btn-primary">
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-title">
            {Icons.palette}
            Plantillas de Email
          </div>
        </div>
        <div className="section-body">
          <div className="section-desc">
            Personaliza las plantillas de correo que se envían a los usuarios.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              'Invitación a Programa',
              'Bienvenida Usuario',
              'Nuevo Match',
              'Recordatorio de Sesión',
              'Resumen Semanal'
            ].map(template => (
              <div 
                key={template}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: '#fafafa',
                  borderRadius: '0.5rem'
                }}
              >
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>{template}</span>
                <button className="btn-outline" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                  Editar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
