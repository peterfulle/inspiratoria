'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

type ProgramInfo = {
  id: string;
  name: string;
  description: string;
  theme: string;
  status: string;
  company: string | null;
  accepting_enrollments: boolean;
};

type RoleOption = { value: 'mentor' | 'mentee' | 'facilitator' | 'participant_cell'; label: string; desc: string };

const ROLES: RoleOption[] = [
  { value: 'mentee', label: 'Mentee', desc: 'Quiero recibir mentoría y crecer en este programa.' },
  { value: 'mentor', label: 'Mentor', desc: 'Quiero acompañar y guiar a los participantes.' },
  { value: 'facilitator', label: 'Facilitador', desc: 'Coordino sesiones y actividades dentro del programa.' },
  { value: 'participant_cell', label: 'Participante', desc: 'Soy parte del grupo de trabajo o célula.' },
];

export default function EnrollPage() {
  const params = useParams();
  const router = useRouter();
  const programId = String(params?.programId || '');

  const [program, setProgram] = useState<ProgramInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<RoleOption['value']>('mentee');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ message: string; email: string; alreadyEnrolled: boolean } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!programId) return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/programs/${programId}/public-info`);
        if (!res.ok) throw new Error(res.status === 404 ? 'Programa no encontrado.' : 'No pudimos cargar el programa.');
        const data: ProgramInfo = await res.json();
        setProgram(data);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Error inesperado.');
      } finally {
        setLoading(false);
      }
    })();
  }, [programId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/programs/${programId}/self-enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), first_name: firstName.trim(), last_name: lastName.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'No pudimos completar la inscripción.');
      setSuccess({ message: data.message, email: data.email, alreadyEnrolled: !!data.already_enrolled });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400 text-sm">Cargando programa…</div>
      </div>
    );
  }

  if (loadError || !program) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-1">No pudimos cargar el programa</h1>
          <p className="text-sm text-gray-600">{loadError || 'Programa no encontrado.'}</p>
        </div>
      </div>
    );
  }

  if (!program.accepting_enrollments) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <h1 className="text-lg font-bold text-gray-900 mb-2">{program.name}</h1>
          <p className="text-sm text-gray-600 mb-1">Este programa no está aceptando inscripciones por ahora.</p>
          <p className="text-xs text-gray-400">Estado actual: {program.status}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-2xl font-extrabold tracking-tight text-gray-900">Inspiratoria</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white p-8">
            {program.company && <p className="text-[11px] uppercase tracking-[0.2em] text-white/70 mb-2">{program.company}</p>}
            <h1 className="text-2xl font-bold mb-2">{program.name}</h1>
            {program.description && <p className="text-sm text-white/80 leading-relaxed">{program.description}</p>}
            {program.theme && (
              <span className="inline-block mt-3 px-3 py-1 rounded-full bg-white/15 text-[11px] font-semibold uppercase tracking-wider">{program.theme}</span>
            )}
          </div>

          {success ? (
            <div className="p-8 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                {success.alreadyEnrolled ? 'Ya estabas inscrito' : '¡Inscripción exitosa!'}
              </h2>
              <p className="text-sm text-gray-600 mb-6">{success.message}</p>
              <p className="text-xs text-gray-500 mb-6">Te enviamos un código de acceso a <strong className="text-gray-900">{success.email}</strong>. Revisa tu correo (incluido el spam).</p>
              <button
                onClick={() => router.push('/login')}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gray-900 text-yellow-300 text-sm font-semibold hover:bg-gray-800 transition"
              >
                Ir a iniciar sesión
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="p-8 space-y-5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Tu rol en este programa</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`text-left p-3 rounded-xl border transition ${role === r.value ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className={`text-[13px] font-bold ${role === r.value ? 'text-violet-700' : 'text-gray-900'}`}>{r.label}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nombre</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} required className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Apellido</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} required className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@correo.com" className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
                <p className="text-[11px] text-gray-400 mt-1.5">Te enviaremos un código de acceso a este correo.</p>
              </div>

              {submitError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-[12px] text-red-700">{submitError}</div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center px-5 py-3 rounded-lg bg-gray-900 text-yellow-300 text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-60"
              >
                {submitting ? 'Inscribiendo…' : 'Inscribirme al programa'}
              </button>

              <p className="text-[11px] text-gray-400 text-center">
                Al inscribirte aceptas recibir un correo de Inspiratoria con tu código de acceso.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
