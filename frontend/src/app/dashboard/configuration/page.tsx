'use client';

import { useState } from 'react';
import { Icons } from './components/Icons';
import { configStyles } from './components/styles';
import GeneralSection from './sections/GeneralSection';
import NotificationsSection from './sections/NotificationsSection';
import SecuritySection from './sections/SecuritySection';
import IntegrationsSection from './sections/IntegrationsSection';
import EmailSection from './sections/EmailSection';
import DangerZoneSection from './sections/DangerZoneSection';

// ============================================================================
// TYPES
// ============================================================================
type TabId = 'general' | 'notifications' | 'security' | 'email' | 'integrations' | 'danger';

interface Tab {
  id: TabId;
  label: string;
  icon: JSX.Element;
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function ConfigurationPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    companyName: 'Inspiratoria',
    timezone: 'America/Santiago',
    language: 'es',
    dateFormat: 'DD/MM/YYYY',
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    matchNotifications: true,
    sessionReminders: true,
    weeklyDigest: true,
    marketingEmails: false,
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: '4h',
    passwordExpiry: false,
    ipWhitelist: false,
    autoBackup: true,
  });

  // Email settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    fromEmail: 'noreply@inspiratoria.com',
    fromName: 'Inspiratoria',
  });

  const tabs: Tab[] = [
    { id: 'general', label: 'General', icon: Icons.settings },
    { id: 'notifications', label: 'Notificaciones', icon: Icons.bell },
    { id: 'security', label: 'Seguridad', icon: Icons.shield },
    { id: 'email', label: 'Email', icon: Icons.mail },
    { id: 'integrations', label: 'Integraciones', icon: Icons.globe },
    { id: 'danger', label: 'Zona de Peligro', icon: Icons.warning },
  ];

  const renderSection = () => {
    switch (activeTab) {
      case 'general':
        return (
          <GeneralSection 
            settings={generalSettings} 
            onSettingsChange={setGeneralSettings} 
          />
        );
      case 'notifications':
        return (
          <NotificationsSection 
            settings={notificationSettings} 
            onSettingsChange={setNotificationSettings} 
          />
        );
      case 'security':
        return (
          <SecuritySection 
            settings={securitySettings} 
            onSettingsChange={setSecuritySettings} 
          />
        );
      case 'email':
        return (
          <EmailSection 
            settings={emailSettings} 
            onSettingsChange={setEmailSettings} 
          />
        );
      case 'integrations':
        return <IntegrationsSection />;
      case 'danger':
        return <DangerZoneSection />;
      default:
        return null;
    }
  };

  return (
    <>
      <style>{configStyles}</style>
      <div className="config-container">
        {/* Header */}
        <div className="config-header">
          <h1 className="config-title">Configuración</h1>
          <p className="config-subtitle">Gestión y mantenimiento del sistema.</p>
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
