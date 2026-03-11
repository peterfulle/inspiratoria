"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  User, 
  Lock, 
  Linkedin, 
  FileText, 
  Settings, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';

// Types
interface InvitationData {
  email: string;
  company_name: string;
  role: 'mentor' | 'mentee';
  program_name: string;
  invited_by_name: string;
  expires_at: string;
}

interface LinkedInProfile {
  full_name: string;
  email: string;
  headline: string;
  bio: string;
  skills: string[];
  experience_years?: number;
  industry?: string;
  current_role?: string;
  picture?: string;
}

interface ProfileData {
  full_name: string;
  headline: string;
  bio: string;
  skills: string[];
  experience_years: number;
  industry: string;
  current_role: string;
  picture?: string;
}

interface RoleConfig {
  // Mentor
  expertise_areas?: string[];
  weekly_availability?: number;
  mentee_preferences?: {
    industries: string[];
    experience_levels: string[];
  };
  // Mentee
  goals?: string;
  development_areas?: string[];
  mentor_preferences?: {
    industries: string[];
    seniority_levels: string[];
  };
}

const STEPS = [
  { id: 1, name: 'Validar', icon: CheckCircle },
  { id: 2, name: 'Cuenta', icon: User },
  { id: 3, name: 'LinkedIn', icon: Linkedin },
  { id: 4, name: 'Perfil', icon: FileText },
  { id: 5, name: 'Configuración', icon: Settings },
  { id: 6, name: 'Confirmación', icon: CheckCircle }
];

export default function OnboardingWizard({ token }: { token: string }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [accountData, setAccountData] = useState({ email: '', password: '', confirmPassword: '', fullName: '' });
  const [linkedInProfile, setLinkedInProfile] = useState<LinkedInProfile | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    headline: '',
    bio: '',
    skills: [],
    experience_years: 0,
    industry: '',
    current_role: '',
    picture: ''
  });
  const [roleConfig, setRoleConfig] = useState<RoleConfig>({});
  const [skippedLinkedIn, setSkippedLinkedIn] = useState(false);

  // Step 1: Validate Token
  useEffect(() => {
    if (token) {
      validateToken();
      
      // Check if returning from LinkedIn callback
      const linkedInData = localStorage.getItem('linkedin_profile');
      if (linkedInData) {
        try {
          const profile = JSON.parse(linkedInData);
          setLinkedInProfile(profile);
          setProfileData({
            full_name: profile.full_name || accountData.fullName,
            headline: profile.headline || '',
            bio: profile.bio || '',
            skills: profile.skills || [],
            experience_years: profile.experience_years || 0,
            industry: profile.industry || '',
            current_role: profile.current_role || '',
            picture: profile.picture || ''
          });
          setCurrentStep(4); // Go to profile review step
          localStorage.removeItem('linkedin_profile'); // Clean up
        } catch (err) {
          console.error('Error parsing LinkedIn data:', err);
        }
      }
    }
  }, [token]);

  const validateToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/invitations/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Token inválido o expirado');
      }
      
      const data = await response.json();
      setInvitation(data);
      setAccountData(prev => ({ ...prev, email: data.email }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Create Account
  const handleCreateAccount = async () => {
    if (accountData.password !== accountData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (accountData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/invitations/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email: accountData.email,
          password: accountData.password,
          full_name: accountData.fullName
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear cuenta');
      }
      
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: LinkedIn OAuth
  const handleConnectLinkedIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/invitations/linkedin/auth-url?state=${token}`);
      if (!response.ok) throw new Error('Error al generar URL de LinkedIn');
      
      const data = await response.json();
      window.location.href = data.auth_url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSkipLinkedIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/invitations/skip-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      if (!response.ok) throw new Error('Error al omitir LinkedIn');
      
      setSkippedLinkedIn(true);
      setProfileData(prev => ({ ...prev, full_name: accountData.fullName }));
      setCurrentStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Review/Edit Profile
  const handleContinueFromProfile = () => {
    if (!profileData.full_name || !profileData.headline) {
      setError('Por favor completa al menos tu nombre y headline');
      return;
    }
    setError(null);
    setCurrentStep(5);
  };

  const handleAddSkill = (skill: string) => {
    if (skill && !profileData.skills.includes(skill)) {
      setProfileData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setProfileData(prev => ({ 
      ...prev, 
      skills: prev.skills.filter(s => s !== skill) 
    }));
  };

  // Step 5: Role-specific Configuration
  const handleContinueFromConfig = () => {
    if (invitation?.role === 'mentor') {
      if (!roleConfig.expertise_areas || roleConfig.expertise_areas.length === 0) {
        setError('Por favor selecciona al menos un área de expertise');
        return;
      }
    } else {
      if (!roleConfig.goals || roleConfig.goals.trim() === '') {
        setError('Por favor describe tus objetivos');
        return;
      }
    }
    setError(null);
    setCurrentStep(6);
  };

  // Step 6: Complete Onboarding
  const handleCompleteOnboarding = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/invitations/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          profile_data: profileData,
          role_config: roleConfig
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al completar onboarding');
      }
      
      const data = await response.json();
      
      // Auto-login and redirect
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('accessToken', data.access_token);
      
      // Redirect to appropriate dashboard
      const dashboardPath = invitation?.role === 'mentor' ? '/mentor-dashboard' : '/mentee-dashboard';
      window.location.href = dashboardPath;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <ValidateTokenStep invitation={invitation} loading={loading} error={error} onContinue={() => setCurrentStep(2)} />;
      case 2:
        return <CreateAccountStep data={accountData} onChange={setAccountData} onSubmit={handleCreateAccount} loading={loading} error={error} />;
      case 3:
        return <LinkedInConnectStep onConnect={handleConnectLinkedIn} onSkip={handleSkipLinkedIn} loading={loading} error={error} role={invitation?.role} />;
      case 4:
        return <ProfileReviewStep profile={profileData} onChange={setProfileData} onAddSkill={handleAddSkill} onRemoveSkill={handleRemoveSkill} onContinue={handleContinueFromProfile} skipped={skippedLinkedIn} error={error} />;
      case 5:
        return <RoleConfigStep role={invitation?.role || 'mentee'} config={roleConfig} onChange={setRoleConfig} onContinue={handleContinueFromConfig} error={error} />;
      case 6:
        return <ConfirmationStep invitation={invitation} profile={profileData} config={roleConfig} onComplete={handleCompleteOnboarding} loading={loading} error={error} onBack={() => setCurrentStep(5)} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    currentStep > step.id ? 'bg-green-500 text-white' :
                    currentStep === step.id ? 'bg-purple-600 text-white ring-4 ring-purple-200' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {currentStep > step.id ? <CheckCircle className="w-6 h-6" /> : <step.icon className="w-6 h-6" />}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${
                    currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.name}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 transition-all ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Step Components

function ValidateTokenStep({ invitation, loading, error, onContinue }: any) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <Loader2 className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-spin" />
        <p className="text-gray-600">Validando tu invitación...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Error de Validación</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          Reintentar
        </button>
      </div>
    );
  }

  if (!invitation) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-6">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Bienvenido a Inspiratoria!</h2>
        <p className="text-gray-600">Has sido invitado por {invitation.invited_by_name}</p>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex justify-between py-3 border-b">
          <span className="font-medium text-gray-700">Email:</span>
          <span className="text-gray-900">{invitation.email}</span>
        </div>
        <div className="flex justify-between py-3 border-b">
          <span className="font-medium text-gray-700">Empresa:</span>
          <span className="text-gray-900">{invitation.company_name}</span>
        </div>
        <div className="flex justify-between py-3 border-b">
          <span className="font-medium text-gray-700">Rol:</span>
          <span className="text-gray-900 capitalize">{invitation.role}</span>
        </div>
        <div className="flex justify-between py-3 border-b">
          <span className="font-medium text-gray-700">Programa:</span>
          <span className="text-gray-900">{invitation.program_name}</span>
        </div>
      </div>

      <button onClick={onContinue} className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
        Continuar <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function CreateAccountStep({ data, onChange, onSubmit, loading, error }: any) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Crea tu Cuenta</h2>
      <p className="text-gray-600 mb-6">Configura tu contraseña para acceder a la plataforma</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
          <input
            type="text"
            value={data.fullName}
            onChange={(e) => onChange({ ...data, fullName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="Tu nombre completo"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={data.email}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
          <input
            type="password"
            value={data.password}
            onChange={(e) => onChange({ ...data, password: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="Mínimo 8 caracteres"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña</label>
          <input
            type="password"
            value={data.confirmPassword}
            onChange={(e) => onChange({ ...data, confirmPassword: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="Repite tu contraseña"
          />
        </div>
      </div>

      <button 
        onClick={onSubmit} 
        disabled={loading || !data.fullName || !data.password || !data.confirmPassword}
        className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
        Crear Cuenta
      </button>
    </div>
  );
}

function LinkedInConnectStep({ onConnect, onSkip, loading, error, role }: any) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Linkedin className="w-10 h-10 text-blue-700" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Conecta con LinkedIn</h2>
        <p className="text-gray-600">Importa tu perfil profesional en segundos con IA</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-3 mb-3">
          <Sparkles className="w-5 h-5 text-purple-600 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">¿Por qué conectar LinkedIn?</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✨ Nuestra IA extrae tu información automáticamente</li>
              <li>⚡ Ahorra tiempo - completamos tu perfil en segundos</li>
              <li>🎯 Generamos un bio profesional personalizado</li>
              <li>🔒 Seguro - Solo lectura, no publicamos nada</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button 
          onClick={onConnect}
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Linkedin className="w-5 h-5" />}
          Conectar con LinkedIn
        </button>
        <button 
          onClick={onSkip}
          disabled={loading}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Omitir - Completar manual
        </button>
      </div>
    </div>
  );
}

function ProfileReviewStep({ profile, onChange, onAddSkill, onRemoveSkill, onContinue, skipped, error }: any) {
  const [newSkill, setNewSkill] = useState('');

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      onAddSkill(newSkill.trim());
      setNewSkill('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {skipped ? 'Completa tu Perfil' : 'Revisa tu Perfil'}
      </h2>
      <p className="text-gray-600 mb-6">
        {skipped ? 'Ingresa tu información profesional' : 'Ajusta los datos extraídos de LinkedIn'}
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo *</label>
          <input
            type="text"
            value={profile.full_name}
            onChange={(e) => onChange({ ...profile, full_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Headline *</label>
          <input
            type="text"
            value={profile.headline}
            onChange={(e) => onChange({ ...profile, headline: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="Ej: Senior Product Manager | Tech Enthusiast"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bio Profesional</label>
          <textarea
            value={profile.bio}
            onChange={(e) => onChange({ ...profile, bio: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 h-32"
            placeholder="Cuéntanos sobre tu experiencia y enfoque profesional..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rol Actual</label>
            <input
              type="text"
              value={profile.current_role}
              onChange={(e) => onChange({ ...profile, current_role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Industria</label>
            <input
              type="text"
              value={profile.industry}
              onChange={(e) => onChange({ ...profile, industry: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Años de Experiencia</label>
          <input
            type="number"
            value={profile.experience_years}
            onChange={(e) => onChange({ ...profile, experience_years: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            min="0"
            max="50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Agregar skill"
            />
            <button onClick={handleAddSkill} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Agregar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill: string) => (
              <span key={skill} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1">
                {skill}
                <button onClick={() => onRemoveSkill(skill)} className="hover:text-purple-900">×</button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <button onClick={onContinue} className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
        Continuar <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function RoleConfigStep({ role, config, onChange, onContinue, error }: any) {
  if (role === 'mentor') {
    return <MentorConfigStep config={config} onChange={onChange} onContinue={onContinue} error={error} />;
  } else {
    return <MenteeConfigStep config={config} onChange={onChange} onContinue={onContinue} error={error} />;
  }
}

function MentorConfigStep({ config, onChange, onContinue, error }: any) {
  const expertiseOptions = ['Liderazgo', 'Tecnología', 'Ventas', 'Marketing', 'Producto', 'Finanzas', 'Recursos Humanos', 'Operaciones'];
  const experienceLevels = ['Junior', 'Mid-level', 'Senior', 'Executive'];
  const industries = ['Tech', 'Finanzas', 'Salud', 'Educación', 'Retail', 'Consultoría'];

  const toggleExpertise = (area: string) => {
    const current = config.expertise_areas || [];
    if (current.includes(area)) {
      onChange({ ...config, expertise_areas: current.filter((a: string) => a !== area) });
    } else {
      onChange({ ...config, expertise_areas: [...current, area] });
    }
  };

  const togglePreference = (type: 'industries' | 'experience_levels', value: string) => {
    const current = config.mentee_preferences || { industries: [], experience_levels: [] };
    const currentList = current[type] || [];
    
    if (currentList.includes(value)) {
      onChange({
        ...config,
        mentee_preferences: {
          ...current,
          [type]: currentList.filter((v: string) => v !== value)
        }
      });
    } else {
      onChange({
        ...config,
        mentee_preferences: {
          ...current,
          [type]: [...currentList, value]
        }
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuración de Mentor</h2>
      <p className="text-gray-600 mb-6">Ayúdanos a conectarte con los mentees ideales</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Áreas de Expertise *</label>
          <div className="grid grid-cols-2 gap-2">
            {expertiseOptions.map(area => (
              <button
                key={area}
                onClick={() => toggleExpertise(area)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  (config.expertise_areas || []).includes(area)
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Disponibilidad Semanal (horas)</label>
          <input
            type="range"
            min="1"
            max="20"
            value={config.weekly_availability || 5}
            onChange={(e) => onChange({ ...config, weekly_availability: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="text-center text-purple-600 font-semibold">{config.weekly_availability || 5} horas/semana</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Preferencias de Mentees</label>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Niveles de Experiencia</p>
            <div className="flex flex-wrap gap-2">
              {experienceLevels.map(level => (
                <button
                  key={level}
                  onClick={() => togglePreference('experience_levels', level)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    (config.mentee_preferences?.experience_levels || []).includes(level)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Industrias</p>
            <div className="flex flex-wrap gap-2">
              {industries.map(industry => (
                <button
                  key={industry}
                  onClick={() => togglePreference('industries', industry)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    (config.mentee_preferences?.industries || []).includes(industry)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {industry}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button onClick={onContinue} className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
        Continuar <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function MenteeConfigStep({ config, onChange, onContinue, error }: any) {
  const developmentAreas = ['Liderazgo', 'Habilidades Técnicas', 'Comunicación', 'Gestión de Tiempo', 'Networking', 'Estrategia de Carrera'];
  const seniorityLevels = ['Mid-level', 'Senior', 'Executive', 'C-Level'];
  const industries = ['Tech', 'Finanzas', 'Salud', 'Educación', 'Retail', 'Consultoría'];

  const toggleDevelopmentArea = (area: string) => {
    const current = config.development_areas || [];
    if (current.includes(area)) {
      onChange({ ...config, development_areas: current.filter((a: string) => a !== area) });
    } else {
      onChange({ ...config, development_areas: [...current, area] });
    }
  };

  const togglePreference = (type: 'industries' | 'seniority_levels', value: string) => {
    const current = config.mentor_preferences || { industries: [], seniority_levels: [] };
    const currentList = current[type] || [];
    
    if (currentList.includes(value)) {
      onChange({
        ...config,
        mentor_preferences: {
          ...current,
          [type]: currentList.filter((v: string) => v !== value)
        }
      });
    } else {
      onChange({
        ...config,
        mentor_preferences: {
          ...current,
          [type]: [...currentList, value]
        }
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuración de Mentee</h2>
      <p className="text-gray-600 mb-6">Cuéntanos sobre tus objetivos y preferencias</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Objetivos Específicos *</label>
          <textarea
            value={config.goals || ''}
            onChange={(e) => onChange({ ...config, goals: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 h-32"
            placeholder="Describe qué esperas lograr con mentoring (ej: transición de carrera, desarrollo de habilidades, networking...)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Áreas de Desarrollo</label>
          <div className="grid grid-cols-2 gap-2">
            {developmentAreas.map(area => (
              <button
                key={area}
                onClick={() => toggleDevelopmentArea(area)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  (config.development_areas || []).includes(area)
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Preferencias de Mentor</label>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Nivel de Seniority</p>
            <div className="flex flex-wrap gap-2">
              {seniorityLevels.map(level => (
                <button
                  key={level}
                  onClick={() => togglePreference('seniority_levels', level)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    (config.mentor_preferences?.seniority_levels || []).includes(level)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Industrias de Interés</p>
            <div className="flex flex-wrap gap-2">
              {industries.map(industry => (
                <button
                  key={industry}
                  onClick={() => togglePreference('industries', industry)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    (config.mentor_preferences?.industries || []).includes(industry)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {industry}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button onClick={onContinue} className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
        Continuar <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function ConfirmationStep({ invitation, profile, config, onComplete, loading, error, onBack }: any) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirma tu Registro</h2>
      <p className="text-gray-600 mb-6">Revisa tu información antes de finalizar</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6 mb-6">
        {/* Personal Info Card */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600" />
            Información Personal
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Nombre:</span>
              <span className="font-medium">{profile.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{invitation?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rol:</span>
              <span className="font-medium capitalize">{invitation?.role}</span>
            </div>
          </div>
        </div>

        {/* Professional Info Card */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Información Profesional
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Headline:</span>
              <span className="font-medium">{profile.headline || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rol Actual:</span>
              <span className="font-medium">{profile.current_role || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Experiencia:</span>
              <span className="font-medium">{profile.experience_years} años</span>
            </div>
            <div>
              <span className="text-gray-600 block mb-1">Skills:</span>
              <div className="flex flex-wrap gap-1">
                {profile.skills.slice(0, 5).map((skill: string) => (
                  <span key={skill} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                    {skill}
                  </span>
                ))}
                {profile.skills.length > 5 && <span className="text-xs text-gray-500">+{profile.skills.length - 5} más</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Role Config Card */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" />
            Configuración de {invitation?.role === 'mentor' ? 'Mentor' : 'Mentee'}
          </h3>
          <div className="space-y-2 text-sm">
            {invitation?.role === 'mentor' ? (
              <>
                <div>
                  <span className="text-gray-600 block mb-1">Áreas de Expertise:</span>
                  <div className="flex flex-wrap gap-1">
                    {(config.expertise_areas || []).map((area: string) => (
                      <span key={area} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{area}</span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Disponibilidad:</span>
                  <span className="font-medium">{config.weekly_availability || 5} horas/semana</span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-gray-600 block mb-1">Objetivos:</span>
                  <p className="text-gray-900 text-xs">{config.goals || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-600 block mb-1">Áreas de Desarrollo:</span>
                  <div className="flex flex-wrap gap-1">
                    {(config.development_areas || []).map((area: string) => (
                      <span key={area} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{area}</span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
          <ChevronLeft className="w-5 h-5" /> Atrás
        </button>
        <button 
          onClick={onComplete}
          disabled={loading}
          className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
          Completar Registro
        </button>
      </div>
    </div>
  );
}
