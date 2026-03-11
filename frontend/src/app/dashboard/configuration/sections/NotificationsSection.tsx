'use client';

import { Icons } from '../components/Icons';
import Toggle from '../components/Toggle';

interface NotificationsSectionProps {
  settings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    matchNotifications: boolean;
    sessionReminders: boolean;
    weeklyDigest: boolean;
    marketingEmails: boolean;
  };
  onSettingsChange: (settings: any) => void;
}

export default function NotificationsSection({ settings, onSettingsChange }: NotificationsSectionProps) {
  const handleToggle = (key: keyof typeof settings) => {
    onSettingsChange({ ...settings, [key]: !settings[key] });
  };

  return (
    <>
      <div className="section">
        <div className="section-header">
          <div className="section-title">
            {Icons.bell}
            Notificaciones del Sistema
          </div>
        </div>
        <div className="section-body">
          <div className="setting-row">
            <div className="setting-row-info">
              <div className="setting-row-label">Notificaciones por Email</div>
              <div className="setting-row-desc">Recibir alertas y actualizaciones importantes por correo</div>
            </div>
            <Toggle active={settings.emailNotifications} onChange={() => handleToggle('emailNotifications')} />
          </div>
          <div className="setting-row">
            <div className="setting-row-info">
              <div className="setting-row-label">Notificaciones Push</div>
              <div className="setting-row-desc">Alertas en tiempo real en el navegador</div>
            </div>
            <Toggle active={settings.pushNotifications} onChange={() => handleToggle('pushNotifications')} />
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-title">
            {Icons.mail}
            Preferencias de Email
          </div>
        </div>
        <div className="section-body">
          <div className="setting-row">
            <div className="setting-row-info">
              <div className="setting-row-label">Nuevos Matches</div>
              <div className="setting-row-desc">Notificar cuando se creen nuevas conexiones mentor-mentee</div>
            </div>
            <Toggle active={settings.matchNotifications} onChange={() => handleToggle('matchNotifications')} />
          </div>
          <div className="setting-row">
            <div className="setting-row-info">
              <div className="setting-row-label">Recordatorios de Sesión</div>
              <div className="setting-row-desc">Enviar recordatorios antes de las sesiones programadas</div>
            </div>
            <Toggle active={settings.sessionReminders} onChange={() => handleToggle('sessionReminders')} />
          </div>
          <div className="setting-row">
            <div className="setting-row-info">
              <div className="setting-row-label">Resumen Semanal</div>
              <div className="setting-row-desc">Recibir un resumen semanal de actividad de la plataforma</div>
            </div>
            <Toggle active={settings.weeklyDigest} onChange={() => handleToggle('weeklyDigest')} />
          </div>
          <div className="setting-row">
            <div className="setting-row-info">
              <div className="setting-row-label">Emails de Marketing</div>
              <div className="setting-row-desc">Recibir actualizaciones sobre nuevas funcionalidades</div>
            </div>
            <Toggle active={settings.marketingEmails} onChange={() => handleToggle('marketingEmails')} />
          </div>
        </div>
      </div>
    </>
  );
}
