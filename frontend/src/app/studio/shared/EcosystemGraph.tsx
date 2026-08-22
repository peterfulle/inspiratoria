'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCollide, forceX, forceY, type Simulation } from 'd3-force';

// ============================================================================
// ECOSYSTEM FORCE-DIRECTED GRAPH — compartido entre el ecosistema personal del
// portal (frontend/src/app/p/[code]/[[...section]]/page.tsx) y las vistas
// admin globales (Studio, Vista Corporativa). La dupla es la relación
// estructural (línea gruesa + sesiones visibles), el resto son vínculos
// sociales sutiles. La afinidad (misma ciudad) no dibuja línea — solo agrupa
// vía una fuerza adicional.
// ============================================================================
export type EcoNodeDatum = {
  id: string; full_name: string; role: string; avatar_url: string; city: string; area: string;
  position: string; organization: string; career: string; profile_complete: boolean;
  is_viewer: boolean; is_my_dupla: boolean; extra_links: number; has_sent_message?: boolean;
  x?: number; y?: number; vx?: number; vy?: number; fx?: number | null; fy?: number | null;
};
export type EcoEdgeDatum = {
  source: string; target: string; type: string; strength: number;
  sessions_completed: number; sessions_planned: number; status: string;
};

export function seededRand(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = (h << 5) - h + seed.charCodeAt(i); h |= 0; }
  return () => { h = (h * 1103515245 + 12345) & 0x7fffffff; return (h % 1000) / 1000; };
}

export function ecoInitials(name: string) {
  return (name || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

// Iconos SVG (mismo estilo trazo que navIcons) para el tab Ecosistema — sin emojis.
export const EcoIcons = {
  eye: (p: { size?: number }) => <svg width={p.size || 15} height={p.size || 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  filter: (p: { size?: number }) => <svg width={p.size || 15} height={p.size || 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M8 12h8M11 18h2" /></svg>,
  trophy: (p: { size?: number }) => <svg width={p.size || 18} height={p.size || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5" /><path d="M8.21 13.89L7 21l5-3 5 3-1.21-7.11" /></svg>,
  users: (p: { size?: number }) => <svg width={p.size || 18} height={p.size || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  bulb: (p: { size?: number }) => <svg width={p.size || 15} height={p.size || 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M15.09 14c.3-.5.5-1.1.7-1.6.5-1.3 1.2-2.5 1.2-4.4 0-3.3-2.7-6-6-6S5 4.7 5 8c0 1.9.7 3.1 1.2 4.4.2.5.4 1.1.7 1.6" /></svg>,
  pin: (p: { size?: number }) => <svg width={p.size || 13} height={p.size || 13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  message: (p: { size?: number }) => <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>,
  expand: (p: { size?: number }) => <svg width={p.size || 13} height={p.size || 13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" /></svg>,
  chevronDown: (p: { size?: number }) => <svg width={p.size || 11} height={p.size || 11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>,
};

export function EcosystemGraph({
  nodes: rawNodes, edges: rawEdges, width = 900, height = 620, selectedId, onSelect,
  viewDuplasOnly, roleFilter, viewerCity, cityOnly, interactedOnly, viewerId,
  rankHighlightNodeIds, rankHighlightEdgeKeys,
}: {
  nodes: EcoNodeDatum[]; edges: EcoEdgeDatum[]; width?: number; height?: number;
  selectedId: string | null; onSelect: (id: string | null) => void;
  viewDuplasOnly: boolean; roleFilter: 'all' | 'mentor' | 'mentee'; viewerCity: string;
  cityOnly: boolean; interactedOnly: boolean; viewerId: string;
  // Resalta un subconjunto (ranking de mejores mentores/mentes/duplas en las
  // vistas admin globales) atenuando todo lo demás — independiente de la
  // selección por click (highlightIds). undefined = sin resaltado por ranking.
  rankHighlightNodeIds?: Set<string>;
  rankHighlightEdgeKeys?: Set<string>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Simulation<EcoNodeDatum, undefined> | null>(null);
  const nodesRef = useRef<EcoNodeDatum[]>([]);
  const [, setTick] = useState(0);
  const [dims, setDims] = useState({ w: width, h: height });
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [dragId, setDragId] = useState<string | null>(null);
  const panningRef = useRef<{ startX: number; startY: number; startTx: number; startTy: number; moved: boolean } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setDims({ w: el.clientWidth || width, h: el.clientHeight || height });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);

  useEffect(() => {
    const w0 = containerRef.current?.clientWidth || width;
    const h0 = containerRef.current?.clientHeight || height;

    // Redes con muchos participantes no caben en el contenedor visible sin
    // amontonarse (el radio de colisión ya reserva espacio para el nombre
    // debajo del avatar, no solo para el círculo). En vez de comprimir a
    // todos dentro del tamaño visible, la simulación corre en un "mundo"
    // que crece con la cantidad de nodos — y la cámara se autoajusta más
    // abajo para que ese mundo completo quede visible por defecto (zoom out
    // automático), sin superposición. Con pocos nodos, spread=1 y el
    // comportamiento es idéntico al de antes.
    const nodeCount = rawNodes.length;
    const BASELINE_NODES = 15; // cantidad que ya cabía bien en el contenedor original
    const spread = Math.max(1, Math.sqrt(nodeCount / BASELINE_NODES));
    const worldW = w0 * spread;
    const worldH = h0 * spread;

    const simNodes: EcoNodeDatum[] = rawNodes.map(n => {
      const rand = seededRand(n.id);
      return { ...n, x: worldW / 2 + (rand() - 0.5) * worldW * 0.7, y: worldH / 2 + (rand() - 0.5) * worldH * 0.7 };
    });
    const nodeById = new Map(simNodes.map(n => [n.id, n]));
    const validEdges = rawEdges.filter(e => nodeById.has(e.source) && nodeById.has(e.target));
    const simLinks = validEdges.map(e => ({ ...e, source: nodeById.get(e.source)!, target: nodeById.get(e.target)! }));
    nodesRef.current = simNodes;

    // Radio de colisión con buffer para la etiqueta (nombre + rol) debajo del
    // avatar — antes casi no dejaba margen y los nombres se pisaban entre sí.
    const collideRadius = (d: any) => (d.is_viewer ? 74 : d.is_my_dupla ? 64 : 58);

    const sim = forceSimulation(simNodes)
      .force('link', forceLink(simLinks as any).id((d: any) => d.id)
        .distance((l: any) => l.type === 'MENTORSHIP' ? 190 : Math.max(190, 320 - (l.strength || 30) * 1.4))
        .strength((l: any) => l.type === 'MENTORSHIP' ? 0.95 : 0.15))
      .force('charge', forceManyBody().strength(-480).distanceMax(650))
      .force('collide', forceCollide().radius(collideRadius).strength(0.9))
      .force('x', forceX(worldW / 2).strength(0.035))
      .force('y', forceY(worldH / 2).strength(0.035))
      .alpha(1).alphaDecay(0.02);

    // Afinidad por ciudad: agrupa sin dibujar línea (sección 24 del instructivo)
    sim.force('affinity', (alpha: number) => {
      for (let i = 0; i < simNodes.length; i++) {
        for (let j = i + 1; j < simNodes.length; j++) {
          const a = simNodes[i], b = simNodes[j];
          if (a.city && a.city === b.city) {
            const dx = (b.x! - a.x!), dy = (b.y! - a.y!);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            if (dist > 150) {
              const f = 0.006 * alpha;
              a.vx! += (dx / dist) * f; a.vy! += (dy / dist) * f;
              b.vx! -= (dx / dist) * f; b.vy! -= (dy / dist) * f;
            }
          }
        }
      }
    });

    sim.on('tick', () => {
      for (const n of simNodes) {
        const r = collideRadius(n);
        n.x = Math.max(r, Math.min(worldW - r, n.x!));
        n.y = Math.max(r, Math.min(worldH - r, n.y!));
      }
      setTick(t => t + 1);
    });
    simRef.current = sim;

    // Auto-fit: centra y escala la cámara para que quepa el mundo completo
    // en el contenedor visible al construir el grafo (una red de 50+
    // personas se ve completa y espaciada, en vez de recortada o amontonada).
    const fitK = Math.min(1, w0 / worldW, h0 / worldH);
    setTransform({ x: (w0 - worldW * fitK) / 2, y: (h0 - worldH * fitK) / 2, k: fitK });

    return () => { sim.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawNodes, rawEdges, width, height]);

  const highlightIds = useMemo(() => {
    if (!selectedId) return null;
    const s = new Set<string>([selectedId]);
    rawEdges.forEach(e => { if (e.source === selectedId) s.add(e.target); if (e.target === selectedId) s.add(e.source); });
    return s;
  }, [selectedId, rawEdges]);

  const interactedSet = useMemo(() => {
    const s = new Set<string>();
    rawEdges.forEach(e => { if (e.source === viewerId) s.add(e.target); if (e.target === viewerId) s.add(e.source); });
    return s;
  }, [rawEdges, viewerId]);

  const passesFilter = useCallback((n: EcoNodeDatum) => {
    if (n.is_viewer) return true;
    if (roleFilter !== 'all' && n.role !== roleFilter) return false;
    if (cityOnly && n.city !== viewerCity) return false;
    if (interactedOnly && !interactedSet.has(n.id)) return false;
    return true;
  }, [roleFilter, cityOnly, viewerCity, interactedOnly, interactedSet]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    setTransform(t => {
      const newK = Math.min(2.5, Math.max(0.15, t.k * (1 - e.deltaY * 0.001)));
      const newX = cx - ((cx - t.x) / t.k) * newK;
      const newY = cy - ((cy - t.y) / t.k) * newK;
      return { x: newX, y: newY, k: newK };
    });
  };

  const zoomBy = (factor: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const cx = rect ? rect.width / 2 : width / 2, cy = rect ? rect.height / 2 : height / 2;
    setTransform(t => {
      const newK = Math.min(2.5, Math.max(0.15, t.k * factor));
      const newX = cx - ((cx - t.x) / t.k) * newK;
      const newY = cy - ((cy - t.y) / t.k) * newK;
      return { x: newX, y: newY, k: newK };
    });
  };

  const handleBgPointerDown = (e: React.PointerEvent) => {
    panningRef.current = { startX: e.clientX, startY: e.clientY, startTx: transform.x, startTy: transform.y, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handleBgPointerMove = (e: React.PointerEvent) => {
    if (!panningRef.current) return;
    const dx = e.clientX - panningRef.current.startX, dy = e.clientY - panningRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) panningRef.current.moved = true;
    setTransform(t => ({ ...t, x: panningRef.current!.startTx + dx, y: panningRef.current!.startTy + dy }));
  };
  const handleBgPointerUp = () => {
    if (panningRef.current && !panningRef.current.moved) onSelect(null);
    panningRef.current = null;
  };

  const handleNodePointerDown = (nodeId: string) => (e: React.PointerEvent) => {
    e.stopPropagation();
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) return;
    setDragId(nodeId);
    simRef.current?.alphaTarget(0.25).restart();
    node.fx = node.x; node.fy = node.y;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handleNodePointerMove = (nodeId: string) => (e: React.PointerEvent) => {
    if (dragId !== nodeId) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) return;
    node.fx = (e.clientX - rect.left - transform.x) / transform.k;
    node.fy = (e.clientY - rect.top - transform.y) / transform.k;
    setTick(t => t + 1);
  };
  const handleNodePointerUp = (nodeId: string) => () => {
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (node) { node.fx = null; node.fy = null; }
    simRef.current?.alphaTarget(0);
    setDragId(null);
  };

  return (
    <div ref={containerRef} className="eco-canvas"
      onWheel={handleWheel} onPointerDown={handleBgPointerDown} onPointerMove={handleBgPointerMove} onPointerUp={handleBgPointerUp}
      style={{ width: '100%', height: '100%', cursor: panningRef.current ? 'grabbing' : 'grab' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`, transformOrigin: '0 0' }}>
        <svg style={{ position: 'absolute', left: 0, top: 0, width: dims.w, height: dims.h, overflow: 'visible', pointerEvents: 'none' }}>
          {rawEdges.map((e, i) => {
            if (viewDuplasOnly && e.type !== 'MENTORSHIP') return null;
            const s = nodesRef.current.find(n => n.id === e.source), t = nodesRef.current.find(n => n.id === e.target);
            if (!s || !t || s.x === undefined || t.x === undefined) return null;
            const selDim = highlightIds ? !(highlightIds.has(e.source) && highlightIds.has(e.target)) : false;
            const rankDim = rankHighlightEdgeKeys ? !(rankHighlightEdgeKeys.has(`${e.source}-${e.target}`) || rankHighlightEdgeKeys.has(`${e.target}-${e.source}`)) : false;
            const dimmed = selDim || rankDim;
            const isDupla = e.type === 'MENTORSHIP';
            const dx = t.x! - s.x!, dy = t.y! - s.y!;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / len, ny = dx / len; // unit normal, perpendicular to the line
            const midX = (s.x! + t.x!) / 2 + nx * 20, midY = (s.y! + t.y!) / 2 + ny * 20;
            return (
              <g key={i} opacity={dimmed ? 0.12 : 1}>
                <line x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  stroke={isDupla ? '#14b8a6' : '#cbd5e1'} strokeWidth={isDupla ? 2.5 : 1.5} opacity={isDupla ? 0.85 : 1}
                  strokeDasharray={isDupla ? undefined : '4 5'} strokeLinecap="round" />
                {isDupla && (
                  <>
                    <rect x={midX - 14} y={midY - 8} width={28} height={16} rx={8} fill="#0f172a" opacity={0.85} />
                    <text x={midX} y={midY + 3.5} textAnchor="middle" fontSize="8.5" fontWeight={700} fill="#fff">
                      {e.sessions_completed}/{e.sessions_planned || e.sessions_completed}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
        {nodesRef.current.map(node => {
          const isSelected = selectedId === node.id;
          const selDim = (highlightIds && !highlightIds.has(node.id)) || !passesFilter(node);
          const rankDim = rankHighlightNodeIds ? !rankHighlightNodeIds.has(node.id) : false;
          const dimmed = selDim || rankDim;
          const ringColor = node.role === 'mentor' ? '#22c55e' : '#3b82f6';
          const size = node.is_viewer ? 68 : node.is_my_dupla ? 54 : 46;
          return (
            <div key={node.id}
              onPointerDown={handleNodePointerDown(node.id)}
              onPointerMove={handleNodePointerMove(node.id)}
              onPointerUp={handleNodePointerUp(node.id)}
              onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
              style={{
                position: 'absolute', left: node.x, top: node.y, transform: 'translate(-50%, -50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                opacity: dimmed ? 0.22 : 1, transition: 'opacity 0.25s', zIndex: node.is_viewer ? 6 : isSelected ? 5 : 3,
                touchAction: 'none',
              }}>
              <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
                {node.is_viewer && !dimmed && <div className="eco-pulse-ring" />}
                {(node.is_viewer || node.is_my_dupla) && !dimmed && <div className="eco-pulse-ring" style={{ animationDelay: '1.3s' }} />}
                <div className="eco-node-breathe" style={{ animationDelay: `${(seededRand(node.id)() * 3).toFixed(2)}s`, width: size, height: size }}>
                  <div style={{
                    width: size, height: size, borderRadius: '50%', overflow: 'hidden',
                    border: `${node.is_viewer ? 4 : 3}px solid ${node.is_viewer ? '#14b8a6' : ringColor}`,
                    background: node.avatar_url ? '#fff' : (node.role === 'mentor' ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#3b82f6,#2563eb)'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isSelected ? `0 0 0 4px ${ringColor}33, 0 6px 18px rgba(15,23,42,0.25)` : '0 2px 8px rgba(15,23,42,0.12)',
                  }}>
                    {node.avatar_url ? (
                      <img src={node.avatar_url} alt={node.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: size > 70 ? '1.3rem' : '1rem' }}>{ecoInitials(node.full_name)}</span>
                    )}
                  </div>
                </div>
                {node.has_sent_message && !node.is_viewer && (
                  <div title="Ha enviado mensajes" style={{
                    position: 'absolute', top: -3, right: -3, width: 20, height: 20, borderRadius: '50%',
                    background: '#0891b2', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(8,145,178,0.5)',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
                  </div>
                )}
              </div>
              <div style={{ marginTop: 6, textAlign: 'center', pointerEvents: 'none', maxWidth: 100 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {node.is_viewer ? 'TÚ' : (node.full_name.split(' ')[0] || '—')}
                </div>
                <div style={{ fontSize: '0.62rem', fontWeight: 600, color: ringColor }}>
                  {node.role === 'mentor' ? 'Mentor' : 'Mentee'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="eco-zoom-controls">
        <button onClick={() => zoomBy(0.85)} aria-label="Alejar">−</button>
        <span>{Math.round(transform.k * 100)}%</span>
        <button onClick={() => zoomBy(1.18)} aria-label="Acercar">+</button>
        <button onClick={() => setTransform({ x: 0, y: 0, k: 1 })} aria-label="Restablecer zoom"><EcoIcons.expand /></button>
      </div>
    </div>
  );
}

// CSS que necesita el grafo y sus paneles — misma hoja usada por el ecosistema
// personal del portal (ahí vive inline dentro de su propio <style>; acá se
// exporta para que las vistas admin globales (Studio, Vista Corporativa)
// puedan inyectarla con <style>{ECO_CSS}</style>).
export const ECO_CSS = `
  .eco-wrap { display: flex; flex-direction: column; gap: 14px; height: 100%; padding: 18px 26px; box-sizing: border-box; overflow: hidden; }
  .eco-header-row { flex-shrink: 0; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .eco-stat-cards { display: flex; gap: 12px; flex-wrap: wrap; }
  .eco-stat-card { background: #fff; border: 1px solid #eef0f2; border-radius: 14px; padding: 12px 18px; min-width: 150px; position: relative; box-shadow: 0 1px 2px rgba(15,23,42,0.03); }
  .eco-stat-label { font-size: 0.68rem; color: #6b7280; font-weight: 600; margin-bottom: 4px; }
  .eco-stat-value { font-size: 1.05rem; font-weight: 800; color: #111827; }
  .eco-stat-bar { height: 4px; border-radius: 4px; background: #eef0f2; margin-top: 8px; overflow: hidden; }
  .eco-stat-bar div { height: 100%; background: linear-gradient(90deg,#14b8a6,#22c55e); border-radius: 4px; }
  .eco-stat-icon { position: absolute; right: 14px; top: 12px; color: #94a3b8; }
  .eco-header-actions { display: flex; gap: 10px; }
  .eco-dropdown-btn { display: flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer; }
  .eco-dropdown-btn:hover { background: #f9fafb; }
  .eco-dot { width: 7px; height: 7px; border-radius: 50%; background: #14b8a6; display: inline-block; }
  .eco-badge-count { background: #14b8a6; color: #fff; font-size: 0.62rem; font-weight: 700; border-radius: 10px; padding: 1px 6px; }
  .eco-dropdown-panel { position: absolute; right: 0; top: calc(100% + 6px); background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 12px 32px -8px rgba(15,23,42,0.18); padding: 10px; z-index: 50; min-width: 220px; }
  .eco-toggle-row { display: flex; align-items: center; gap: 8px; padding: 7px 6px; font-size: 0.8rem; color: #374151; cursor: pointer; white-space: nowrap; border-radius: 8px; }
  .eco-toggle-row:hover { background: #f9fafb; }
  .eco-dropdown-sep { height: 1px; background: #f0f0f0; margin: 6px 0; }

  .eco-main-grid { display: grid; grid-template-columns: 260px 1fr 300px; gap: 16px; align-items: stretch; flex: 1; min-height: 0; }
  @media (max-width: 1100px) { .eco-main-grid { grid-template-columns: 1fr; overflow-y: auto; } }
  .eco-left-col, .eco-right-col { display: flex; flex-direction: column; gap: 14px; overflow-y: auto; min-height: 0; }
  .eco-graph-col { min-width: 0; min-height: 0; height: 100%; }

  .eco-panel { background: #fff; border: 1px solid #eef0f2; border-radius: 16px; padding: 16px; box-shadow: 0 1px 2px rgba(15,23,42,0.03); }
  .eco-panel-title { font-size: 0.82rem; font-weight: 700; color: #111827; margin-bottom: 10px; }
  .eco-panel-sub { font-size: 0.7rem; color: #6b7280; margin-bottom: 10px; margin-top: -6px; }
  .eco-empty-hint { font-size: 0.75rem; color: #9ca3af; }

  .eco-legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.76rem; color: #4b5563; margin-bottom: 8px; }
  .eco-legend-dot { width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
  .eco-legend-line { width: 22px; height: 2px; background: #cbd5e1; flex-shrink: 0; display: inline-block; }
  .eco-legend-line-dashed { background: repeating-linear-gradient(90deg, #94a3b8 0 4px, transparent 4px 8px); }

  .eco-city-row { display: flex; justify-content: space-between; font-size: 0.78rem; color: #374151; padding: 6px 0; border-bottom: 1px solid #f6f7f8; }
  .eco-city-row:last-child { border-bottom: none; }
  .eco-city-count { font-weight: 700; color: #111827; }

  .eco-challenge-row { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f6f7f8; }
  .eco-challenge-row:last-child { border-bottom: none; }
  .eco-challenge-check { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #d1d5db; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; color: #fff; flex-shrink: 0; margin-top: 1px; }
  .eco-challenge-check.done { background: #14b8a6; border-color: #14b8a6; }
  .eco-challenge-label { font-size: 0.74rem; color: #374151; margin-bottom: 4px; }
  .eco-challenge-frac { font-size: 0.7rem; font-weight: 700; color: #6b7280; flex-shrink: 0; }
  .eco-mini-bar { height: 4px; border-radius: 4px; background: #eef0f2; overflow: hidden; }
  .eco-mini-bar div { height: 100%; background: #14b8a6; border-radius: 4px; }

  .eco-canvas {
    position: relative; overflow: hidden; border-radius: 16px; border: 1px solid #eef0f2;
    background-color: #fbfbfc;
    background-image:
      radial-gradient(circle at 12% 18%, rgba(8,145,178,0.10), transparent 42%),
      radial-gradient(circle at 88% 12%, rgba(59,130,246,0.09), transparent 42%),
      radial-gradient(circle at 30% 88%, rgba(8,145,178,0.07), transparent 40%),
      radial-gradient(circle at 92% 82%, rgba(34,197,94,0.08), transparent 42%);
    background-repeat: no-repeat, no-repeat, no-repeat, no-repeat;
  }
  .eco-canvas::before {
    content: ''; position: absolute; inset: -100px; pointer-events: none; z-index: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cg stroke='%23dbe3ea' stroke-width='1' fill='none' opacity='0.7'%3E%3Cline x1='15' y1='25' x2='70' y2='55'/%3E%3Cline x1='70' y1='55' x2='130' y2='30'/%3E%3Cline x1='50' y1='120' x2='110' y2='150'/%3E%3Cline x1='110' y1='150' x2='170' y2='115'/%3E%3Cline x1='20' y1='160' x2='50' y2='120'/%3E%3Cline x1='130' y1='30' x2='175' y2='70'/%3E%3C/g%3E%3Cg fill='%23c9d4de'%3E%3Ccircle cx='15' cy='25' r='2.2'/%3E%3Ccircle cx='70' cy='55' r='2.2'/%3E%3Ccircle cx='130' cy='30' r='2.2'/%3E%3Ccircle cx='50' cy='120' r='2.2'/%3E%3Ccircle cx='110' cy='150' r='2.2'/%3E%3Ccircle cx='170' cy='115' r='2.2'/%3E%3Ccircle cx='20' cy='160' r='2.2'/%3E%3Ccircle cx='175' cy='70' r='2.2'/%3E%3C/g%3E%3C/svg%3E");
    background-repeat: repeat; background-size: 200px 200px;
    animation: ecoDriftBg 38s linear infinite;
  }
  /* Vida ambiental del grafo — sutil, no debe distraer (sección 21 del instructivo) */
  @keyframes ecoDriftBg { 0% { transform: translate(0, 0); } 100% { transform: translate(-200px, -200px); } }
  @keyframes ecoBreathe { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  @keyframes ecoPulseRing { 0% { transform: scale(0.85); opacity: 0.55; } 100% { transform: scale(1.9); opacity: 0; } }
  .eco-node-breathe { animation: ecoBreathe 5s ease-in-out infinite; }
  .eco-pulse-ring { position: absolute; inset: -8px; border-radius: 50%; border: 2px solid #14b8a6; animation: ecoPulseRing 2.6s cubic-bezier(0.4,0,0.2,1) infinite; pointer-events: none; }
  .eco-zoom-controls { position: absolute; left: 16px; bottom: 16px; z-index: 2; display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 6px 10px; box-shadow: 0 4px 14px rgba(15,23,42,0.08); font-size: 0.75rem; color: #374151; font-weight: 600; }
  .eco-zoom-controls button { border: none; background: #f3f4f6; width: 22px; height: 22px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; color: #374151; display: flex; align-items: center; justify-content: center; }
  .eco-zoom-controls button:hover { background: #e5e7eb; }

  .eco-detail-panel { position: relative; }
  .eco-detail-close { position: absolute; top: 12px; right: 12px; width: 26px; height: 26px; border-radius: 50%; border: none; background: #f3f4f6; color: #6b7280; cursor: pointer; font-size: 1rem; }
  .eco-detail-close:hover { background: #fef2f2; color: #dc2626; }
  .eco-detail-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .eco-detail-avatar { width: 56px; height: 56px; border-radius: 50%; border: 3px solid #e5e7eb; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #f3f4f6; font-weight: 800; color: #6b7280; }
  .eco-detail-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .eco-detail-name { font-size: 0.95rem; font-weight: 800; color: #111827; }
  .eco-detail-role { font-size: 0.72rem; font-weight: 700; }
  .eco-detail-city { font-size: 0.7rem; color: #6b7280; margin-top: 2px; display: inline-flex; align-items: center; gap: 4px; }
  .eco-incomplete-note { font-size: 0.76rem; color: #92400e; background: #fef3c7; border: 1px solid #fbbf24; border-radius: 10px; padding: 10px 12px; margin-bottom: 12px; }
  .eco-detail-fields { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
  .eco-detail-fields div { display: flex; justify-content: space-between; font-size: 0.76rem; border-bottom: 1px solid #f6f7f8; padding-bottom: 6px; }
  .eco-detail-fields span:first-child { color: #9ca3af; font-weight: 600; }
  .eco-detail-fields span:last-child { color: #111827; font-weight: 600; text-align: right; }
  .eco-detail-sessions { margin-bottom: 14px; font-size: 0.76rem; color: #374151; display: flex; flex-direction: column; gap: 6px; }
  .eco-detail-sessions span:nth-child(2) { font-weight: 700; color: #111827; }
  .eco-btn-primary { width: 100%; padding: 11px; border-radius: 12px; border: none; background: linear-gradient(135deg,#0891b2,#06b6d4); color: #fff; font-weight: 700; font-size: 0.82rem; cursor: pointer; margin-bottom: 8px; transition: transform 0.15s; display: flex; align-items: center; justify-content: center; gap: 7px; }
  .eco-btn-primary:hover { transform: translateY(-1px); }
  .eco-btn-secondary { width: 100%; padding: 10px; border-radius: 12px; border: 1px solid #e5e7eb; background: #fff; color: #374151; font-weight: 600; font-size: 0.8rem; cursor: pointer; }
  .eco-btn-secondary:hover { background: #f9fafb; }

  .eco-insight-row { font-size: 0.76rem; color: #374151; padding: 8px 0; border-bottom: 1px solid #f6f7f8; line-height: 1.4; display: flex; align-items: flex-start; gap: 7px; }
  .eco-insight-row svg { flex-shrink: 0; margin-top: 2px; color: #f59e0b; }
  .eco-insight-row:last-child { border-bottom: none; }

  .eco-bottom-bar { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; background: #fff; border: 1px solid #eef0f2; border-radius: 16px; padding: 18px 20px; flex-shrink: 0; max-height: 34%; overflow-y: auto; }
  @media (max-width: 900px) { .eco-bottom-bar { grid-template-columns: 1fr; } }
  .eco-bottom-numbers { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .eco-bottom-numbers div { display: flex; flex-direction: column; }
  .eco-bottom-numbers strong { font-size: 1.3rem; font-weight: 800; color: #111827; }
  .eco-bottom-numbers span { font-size: 0.66rem; color: #6b7280; margin-top: 2px; }
  .eco-level-row { display: flex; justify-content: space-between; font-size: 0.76rem; color: #374151; margin-bottom: 3px; }
  .eco-level-track { height: 5px; border-radius: 5px; background: #f3f4f6; overflow: hidden; margin-bottom: 8px; }
  .eco-level-track div { height: 100%; border-radius: 5px; }
`;
