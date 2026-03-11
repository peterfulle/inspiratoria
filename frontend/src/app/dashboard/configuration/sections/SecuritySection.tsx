'use client';

import { Icons } from '../components/Icons';
import Toggle from '../components/Toggle';

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
  const handleToggle = (key: keyof typeof settings) => {
    onSettingsChange({ ...settings, [key]: !settings[key] });
  };

  return (
    <>
      <div className="section">
        <div className="section-header">
          <div className="section-title">
            {Icons.shield}
            Autenticación
          </div>
        </div>
        <div className="section-body">
          <div className="setting-row">
            <div className="setting-row-info">
              <div className="setting-row-label">Autenticación de Dos Factores (2FA)</div>
              <div className="setting-row-desc">Requiere código adicional al iniciar sesión</div>
            </div>
            <Toggle active={settings.twoFactorAuth} onChange={() => handleToggle('twoFactorAuth')} />
          </div>
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
              <div className="setting-row-label">Expiración de Contraseña</div>
              <div className="setting-row-desc">Forzar cambio de contraseña cada 90 días</div>
            </div>
            <Toggle active={settings.passwordExpiry} onChange={() => handleToggle('passwordExpiry')} />
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-title">
            {Icons.lock}
            Control de Acceso
          </div>
        </div>
        <div className="section-body">
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
