'use client';
import { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import { EcosystemGraph, EcoIcons, ecoInitials, ECO_CSS, type EcoNodeDatum, type EcoEdgeDatum } from './EcosystemGraph';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

type ViewMode = 'general' | 'mentors' | 'mentees' | 'duplas';

type GlobalNode = {
  id: string; full_name: string; role: string; avatar_url: string; city: string; area: string;
  position: string; profile_complete: boolean; access_count: number;
  mentoring_score: number; platform_score: number; engagement_score: number;
};
type GlobalEdge = {
  source: string; target: string; type: string;
  sessions_completed: number; sessions_planned: number; status: string;
};
type DuplaRanked = {
  mentor_id: string; mentor_name: string; mentee_id: string; mentee_name: string;
  sessions_completed: number; sessions_planned: number; status: string; score: number;
};
type EcosystemGlobalData = {
  program: { id: string; name: string };
  nodes: GlobalNode[];
  edges: GlobalEdge[];
  rankings: { mentors: GlobalNode[]; mentees: GlobalNode[]; duplas: DuplaRanked[] };
};

const VIEW_LABELS: Record<ViewMode, string> = {
  general: 'Vista general',
  mentors: 'Top Mentores',
  mentees: 'Top Mentes',
  duplas: 'Mejores Duplas',
};

function scoreColor(score: number) {
  if (score >= 70) return '#059669';
  if (score >= 40) return '#d97706';
  return '#dc2626';
}

/**
 * Ecosistema GLOBAL de un programa — a diferencia del ecosistema personal del
 * portal (que se centra en "vos"), esta vista admin muestra a todos los
 * participantes por igual, con un ranking de mejores mentores/mentes/duplas.
 * Se usa tanto en Studio (program/[programId]) como en Vista Corporativa
 * (dashboard), ambas le pasan el mismo `programId`.
 */
export default function GlobalEcosystemView({ programId }: { programId: string }) {
  const [data, setData] = useState<EcosystemGlobalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<ViewMode>('general');
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!programId) return;
    setLoading(true);
    setError('');
    apiFetch(`${API_URL}/api/programs/${programId}/ecosystem-global`)
      .then(r => { if (!r.ok) throw new Error('failed'); return r.json(); })
      .then(setData)
      .catch(() => setError('No se pudo cargar el ecosistema de este programa.'))
      .finally(() => setLoading(false));
  }, [programId]);

  const graphNodes: EcoNodeDatum[] = useMemo(() => (data?.nodes || []).map(n => ({
    id: n.id, full_name: n.full_name, role: n.role, avatar_url: n.avatar_url, city: n.city, area: n.area,
    position: n.position, organization: '', career: '', profile_complete: n.profile_complete,
    is_viewer: false, is_my_dupla: false, extra_links: 0,
  })), [data]);

  const graphEdges: EcoEdgeDatum[] = useMemo(() => (data?.edges || []).map(e => ({
    source: e.source, target: e.target, type: e.type, strength: 85,
    sessions_completed: e.sessions_completed, sessions_planned: e.sessions_planned, status: e.status,
  })), [data]);

  const topIds = useMemo(() => {
    if (!data || view === 'general') return undefined;
    if (view === 'mentors') return new Set(data.rankings.mentors.slice(0, 5).map(m => m.id));
    if (view === 'mentees') return new Set(data.rankings.mentees.slice(0, 5).map(m => m.id));
    return undefined;
  }, [data, view]);

  const topEdgeKeys = useMemo(() => {
    if (!data || view !== 'duplas') return undefined;
    return new Set(data.rankings.duplas.slice(0, 5).map(d => `${d.mentor_id}-${d.mentee_id}`));
  }, [data, view]);

  const topDuplaNodeIds = useMemo(() => {
    if (!data || view !== 'duplas') return undefined;
    const s = new Set<string>();
    data.rankings.duplas.slice(0, 5).forEach(d => { s.add(d.mentor_id); s.add(d.mentee_id); });
    return s;
  }, [data, view]);

  const selectedNode = data?.nodes.find(n => n.id === selectedId) || null;

  if (loading) return (
    <div style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="p-loading-spinner" />
      <style>{`.p-loading-spinner { width: 36px; height: 36px; border: 3px solid #e0f2fe; border-top: 3px solid #0891b2; border-radius: 50%; animation: gev-spin 0.8s linear infinite; } @keyframes gev-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !data) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>{error || 'Sin datos.'}</div>
  );

  return (
    <div className="eco-wrap" style={{ height: 720 }}>
      <style>{ECO_CSS}</style>
      <div className="eco-header-row">
        <div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827' }}>Ecosistema Global</div>
          <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>{data.program.name} · {data.nodes.length} participantes</div>
        </div>
        <div className="eco-header-actions" style={{ position: 'relative' }}>
          <button className="eco-dropdown-btn" onClick={() => setViewMenuOpen(v => !v)}>
            <EcoIcons.eye /> {VIEW_LABELS[view]} <EcoIcons.chevronDown />
          </button>
          {viewMenuOpen && (
            <div className="eco-dropdown-panel">
              {(Object.keys(VIEW_LABELS) as ViewMode[]).map(v => (
                <div key={v} className="eco-toggle-row" onClick={() => { setView(v); setViewMenuOpen(false); }}>
                  {v === view && <span className="eco-dot" />} {VIEW_LABELS[v]}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="eco-main-grid">
        {/* Left: legend + cities */}
        <div className="eco-left-col">
          <div className="eco-panel">
            <div className="eco-panel-title">Leyenda</div>
            <div className="eco-legend-item"><span className="eco-legend-dot" style={{ background: '#22c55e' }} /> Mentor</div>
            <div className="eco-legend-item"><span className="eco-legend-dot" style={{ background: '#3b82f6' }} /> Mentee</div>
            <div className="eco-legend-item"><span className="eco-legend-line" /> Dupla (mentoría)</div>
            <div className="eco-legend-item"><span className="eco-legend-line eco-legend-line-dashed" /> Vínculo social</div>
          </div>
          {view !== 'general' && (
            <div className="eco-panel">
              <div className="eco-panel-title">{VIEW_LABELS[view]}</div>
              <div className="eco-panel-sub">Resaltados en el grafo — top 5</div>
              {view === 'duplas' ? (
                data.rankings.duplas.length === 0 ? <div className="eco-empty-hint">Sin duplas activas todavía.</div> :
                data.rankings.duplas.map((d, i) => (
                  <div key={`${d.mentor_id}-${d.mentee_id}`} className="eco-city-row" style={{ alignItems: 'center' }}>
                    <span>#{i + 1} {d.mentor_name.split(' ')[0]} ↔ {d.mentee_name.split(' ')[0]}</span>
                    <span className="eco-city-count" style={{ color: scoreColor(d.score) }}>{d.score}</span>
                  </div>
                ))
              ) : (
                (view === 'mentors' ? data.rankings.mentors : data.rankings.mentees).length === 0 ? <div className="eco-empty-hint">Sin datos todavía.</div> :
                (view === 'mentors' ? data.rankings.mentors : data.rankings.mentees).map((n, i) => (
                  <div key={n.id} className="eco-city-row" style={{ alignItems: 'center', cursor: 'pointer' }} onClick={() => setSelectedId(n.id)}>
                    <span>#{i + 1} {n.full_name}</span>
                    <span className="eco-city-count" style={{ color: scoreColor(n.engagement_score) }}>{n.engagement_score}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Center: graph */}
        <div className="eco-graph-col">
          <EcosystemGraph
            nodes={graphNodes} edges={graphEdges} height={620}
            selectedId={selectedId} onSelect={setSelectedId}
            viewDuplasOnly={false} roleFilter="all" viewerCity="" cityOnly={false} interactedOnly={false} viewerId=""
            rankHighlightNodeIds={view === 'duplas' ? topDuplaNodeIds : topIds}
            rankHighlightEdgeKeys={topEdgeKeys}
          />
        </div>

        {/* Right: selected participant detail */}
        <div className="eco-right-col">
          {selectedNode ? (
            <div className="eco-panel eco-detail-panel">
              <button className="eco-detail-close" onClick={() => setSelectedId(null)}>×</button>
              <div className="eco-detail-header">
                <div className="eco-detail-avatar" style={{ borderColor: selectedNode.role === 'mentor' ? '#22c55e' : '#3b82f6' }}>
                  {selectedNode.avatar_url ? <img src={selectedNode.avatar_url} alt="" /> : <span>{ecoInitials(selectedNode.full_name)}</span>}
                </div>
                <div>
                  <div className="eco-detail-name">{selectedNode.full_name}</div>
                  <div className="eco-detail-role" style={{ color: selectedNode.role === 'mentor' ? '#22c55e' : '#3b82f6' }}>
                    {selectedNode.role === 'mentor' ? 'Mentor' : 'Mentee'}
                  </div>
                  {selectedNode.city && <div className="eco-detail-city"><EcoIcons.pin /> {selectedNode.city}</div>}
                </div>
              </div>
              {!selectedNode.profile_complete && (
                <div className="eco-incomplete-note">Esta persona aún no ha completado sus datos de perfil.</div>
              )}
              <div className="eco-detail-fields">
                {selectedNode.position && <div><span>Cargo</span><span>{selectedNode.position}</span></div>}
                {selectedNode.area && <div><span>Área</span><span>{selectedNode.area}</span></div>}
                <div><span>Accesos al portal</span><span>{selectedNode.access_count}</span></div>
              </div>
              <div className="eco-detail-sessions">
                <span>Score de mentoría</span>
                <span style={{ color: scoreColor(selectedNode.mentoring_score) }}>{selectedNode.mentoring_score}</span>
                <div className="eco-mini-bar"><div style={{ width: `${selectedNode.mentoring_score}%`, background: scoreColor(selectedNode.mentoring_score) }} /></div>
              </div>
              <div className="eco-detail-sessions">
                <span>Score de plataforma</span>
                <span style={{ color: scoreColor(selectedNode.platform_score) }}>{selectedNode.platform_score}</span>
                <div className="eco-mini-bar"><div style={{ width: `${selectedNode.platform_score}%`, background: scoreColor(selectedNode.platform_score) }} /></div>
              </div>
              <div className="eco-detail-sessions">
                <span>Score total</span>
                <span style={{ color: scoreColor(selectedNode.engagement_score), fontWeight: 800 }}>{selectedNode.engagement_score}</span>
              </div>
            </div>
          ) : (
            <div className="eco-panel">
              <div className="eco-panel-title">Detalle</div>
              <div className="eco-empty-hint">Haz clic en una persona del grafo para ver su ficha, o elige una vista de ranking arriba.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
