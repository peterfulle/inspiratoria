'use client';

import { Icons } from '../components/Icons';

interface GeneralSectionProps {
  settings: {
    companyName: string;
    timezone: string;
    language: string;
    dateFormat: string;
  };
  onSettingsChange: (settings: any) => void;
}

export default function GeneralSection({ settings, onSettingsChange }: GeneralSectionProps) {
  return (
    <>
      <div className="section">
        <div className="section-header">
          <div className="section-title">
            {Icons.settings}
            Configuración General
          </div>
        </div>
        <div className="section-body">
          <div className="input-row">
            <div className="input-group">
              <label className="input-label">Nombre de la Plataforma</label>
              <input
                type="text"
                className="input-field"
                value={settings.companyName}
                onChange={(e) => onSettingsChange({ ...settings, companyName: e.target.value })}
                placeholder="Inspiratoria"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Zona Horaria</label>
              <select 
                className="select-field"
                value={settings.timezone}
                onChange={(e) => onSettingsChange({ ...settings, timezone: e.target.value })}
              >
                <option value="America/Santiago">America/Santiago (GMT-3)</option>
                <option value="America/Bogota">America/Bogota (GMT-5)</option>
                <option value="America/Mexico_City">America/Mexico_City (GMT-6)</option>
                <option value="America/New_York">America/New_York (GMT-5)</option>
                <option value="Europe/Madrid">Europe/Madrid (GMT+1)</option>
              </select>
            </div>
          </div>
          <div className="input-row">
            <div className="input-group">
              <label className="input-label">Idioma</label>
              <select 
                className="select-field"
                value={settings.language}
                onChange={(e) => onSettingsChange({ ...settings, language: e.target.value })}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Formato de Fecha</label>
              <select 
                className="select-field"
                value={settings.dateFormat}
                onChange={(e) => onSettingsChange({ ...settings, dateFormat: e.target.value })}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button className="btn-primary">Guardar Cambios</button>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-title">
            {Icons.palette}
            Personalización
          </div>
        </div>
        <div className="section-body">
          <div className="section-desc">
            Personaliza la apariencia de la plataforma para cada empresa cliente (white-label).
          </div>
          <div className="input-row">
            <div className="input-group">
              <label className="input-label">Logo URL</label>
              <input
                type="text"
                className="input-field"
                placeholder="https://ejemplo.com/logo.png"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Color Primario</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="color"
                  defaultValue="#1a1a1a"
                  style={{ width: '3rem', height: '2.25rem', border: 'none', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  className="input-field"
                  defaultValue="#1a1a1a"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button className="btn-secondary">Vista Previa</button>
          </div>
        </div>
      </div>
    </>
  );
}
