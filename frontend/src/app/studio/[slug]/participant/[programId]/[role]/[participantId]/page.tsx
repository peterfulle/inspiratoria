'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const ROLE_LABEL: Record<string, string> = {
  facilitator: 'Facilitador',
  mentor: 'Mentor',
  mentee: 'Mentee',
  participant_cell: 'Participante celula',
};

export default function ParticipantRoleDashboardPage() {
  const router = useRouter();
  const params = useParams();

  const slug = params.slug as string;
  const programId = params.programId as string;
  const role = (params.role as string) || 'participant_cell';
  const participantId = params.participantId as string;

  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState<any>(null);
  const [program, setProgram] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const participantRes = await apiFetch(`${API_URL}/api/programs/${programId}/participants`);
        if (participantRes.ok) {
          const participantList = await participantRes.json();
          const found = (participantList || []).find((p: any) => p.id === participantId);
          if (found) setParticipant(found);
        }

        const programRes = await apiFetch(`${API_URL}/api/programs/${programId}`);
        if (programRes.ok) {
          const programData = await programRes.json();
          setProgram(programData);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [programId, participantId]);

  const roleCards = {
    facilitator: [
      { title: 'Cohortes activas', value: '3', hint: 'Grupos que lidera actualmente' },
      { title: 'Sesiones esta semana', value: '5', hint: 'Incluye talleres y seguimiento' },
      { title: 'Alertas de avance', value: '2', hint: 'Participantes sin actividad reciente' },
    ],
    mentor: [
      { title: 'Mentees asignados', value: '4', hint: 'Relacion mentor-mentee vigente' },
      { title: 'Proxima sesion', value: 'Jueves 10:00', hint: 'Agenda sincronizada del programa' },
      { title: 'Objetivos en curso', value: '7', hint: 'Objetivos activos de mentoring' },
    ],
    mentee: [
      { title: 'Mentor principal', value: 'Asignado', hint: 'Vinculacion disponible' },
      { title: 'Objetivos personales', value: '3', hint: 'Con seguimiento y feedback' },
      { title: 'Avance general', value: '68%', hint: 'Progreso estimado del programa' },
    ],
    participant_cell: [
      { title: 'Ruta activa', value: 'Onboarding', hint: 'Ruta actual de aprendizaje' },
      { title: 'Actividades completadas', value: '6', hint: 'Completadas en los ultimos 30 dias' },
      { title: 'Proxima actividad', value: 'Miercoles', hint: 'Taller colaborativo programado' },
    ],
  } as Record<string, Array<{ title: string; value: string; hint: string }>>;

  const cards = roleCards[role] || roleCards.participant_cell;

  if (loading) {
    return <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>Cargando dashboard del participante...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <button
          onClick={() => router.push(`/studio/${slug}/manage-programs?program=${programId}`)}
          style={{
            border: '1px solid #d1d5db',
            background: '#fff',
            borderRadius: 8,
            padding: '8px 12px',
            cursor: 'pointer',
            marginBottom: 16,
          }}
        >
          Volver al programa
        </button>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 18, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
            Programa: {program?.name || programId}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
            Dashboard {ROLE_LABEL[role] || role}
          </div>
          <div style={{ color: '#4b5563' }}>
            {participant?.user?.nombre || participant?.user?.first_name || 'Participante'} {participant?.user?.apellidos || participant?.user?.last_name || ''}
            {' · '}
            {participant?.user?.email || 'Sin email'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
          {cards.map((card) => (
            <div key={card.title} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{card.title}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{card.value}</div>
              <div style={{ fontSize: 12, color: '#4b5563' }}>{card.hint}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: '#111827' }}>Acceso seguro</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#374151', lineHeight: 1.7 }}>
            <li>Ingreso por /login con OTP por correo.</li>
            <li>Activacion inicial con app Authenticator (TOTP).</li>
            <li>Al completar activacion, el usuario queda habilitado para su dashboard por rol.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
