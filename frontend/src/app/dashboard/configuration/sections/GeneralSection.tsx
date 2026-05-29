'use client';

import { useState, useEffect } from 'react';
import { Icons } from '../components/Icons';
import { applyPrefs, getStorageKey, RADIUS_MAP, FONT_MAP } from '@/components/UIPrefsLoader';

interface GeneralSectionProps {
  settings: {
    companyName: string;
    timezone: string;
    language: string;
    dateFormat: string;
  };
  onSettingsChange: (settings: any) => void;
}

// ── Font options ────────────────────────────────────────────────────
const FONTS = [
  { id: 'inter',   name: 'Inter',              sample: 'Aa' },
  { id: 'poppins', name: 'Poppins',             sample: 'Aa' },
  { id: 'dmsans',  name: 'DM Sans',             sample: 'Aa' },
  { id: 'manrope', name: 'Manrope',             sample: 'Aa' },
  { id: 'jakarta', name: 'Plus Jakarta Sans',   sample: 'Aa' },
  { id: 'grotesk', name: 'Space Grotesk',       sample: 'Aa' },
];

// ── Preset themes ──────────────────────────────────────────────────
const PRESETS = [
  { id: 'inspiratoria', name: 'Inspiratoria', accent: '#F5C800', accentText: '#0f0f0f', desc: 'Amarillo marca' },
  { id: 'ocean',        name: 'Océano',       accent: '#0ea5e9', accentText: '#ffffff', desc: 'Azul cielo' },
  { id: 'forest',       name: 'Bosque',       accent: '#22c55e', accentText: '#ffffff', desc: 'Verde esmeralda' },
  { id: 'sunset',       name: 'Atardecer',    accent: '#f97316', accentText: '#ffffff', desc: 'Naranja vibrante' },
  { id: 'violet',       name: 'Violeta',      accent: '#8b5cf6', accentText: '#ffffff', desc: 'Púrpura moderno' },
  { id: 'rose',         name: 'Rosa',         accent: '#ec4899', accentText: '#ffffff', desc: 'Rosa eléctrico' },
  { id: 'slate',        name: 'Pizarra',      accent: '#475569', accentText: '#ffffff', desc: 'Gris ejecutivo' },
];

const DENSITIES = [
  { id: 'compact',  label: 'Compacto',  desc: 'Más información visible' },
  { id: 'normal',   label: 'Normal',    desc: 'Balance perfecto' },
  { id: 'spacious', label: 'Espacioso', desc: 'Más respiro visual' },
];

const RADIUS = [
  { id: 'sharp',   label: 'Recto',     px: '4px' },
  { id: 'rounded', label: 'Redondeado', px: '12px' },
  { id: 'pill',    label: 'Suave',     px: '20px' },
];

export default function GeneralSection({ settings, onSettingsChange }: GeneralSectionProps) {
  const [saved,   setSaved]   = useState(false);
  const [applied, setApplied] = useState(false);

  // Personalización state
  const [preset,     setPreset]     = useState('inspiratoria');
  const [accent,     setAccent]     = useState('#F5C800');
  const [accentText, setAccentText] = useState('#0f0f0f');
  const [density,    setDensity]    = useState('normal');
  const [radius,     setRadius]     = useState('rounded');
  const [font,       setFont]       = useState('inter');
  const [logoUrl,    setLogoUrl]    = useState('');
  const [logoErr,    setLogoErr]    = useState(false);

  // Load saved prefs on mount (user-scoped key)
  useEffect(() => {
    try {
      const key = getStorageKey();
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const p = JSON.parse(raw);
      setPreset(p.preset || 'inspiratoria');
      setAccent(p.accent || '#F5C800');
      setAccentText(p.accentText || '#0f0f0f');
      setDensity(p.density || 'normal');
      setRadius(p.radius || 'rounded');
      setFont(p.font || 'inter');
      setLogoUrl(p.logoUrl || '');
      applyPrefs(p);
    } catch {}
  }, []);

  const selectPreset = (p: typeof PRESETS[0]) => {
    setPreset(p.id);
    setAccent(p.accent);
    setAccentText(p.accentText);
  };

  const handleApply = () => {
    const prefs = { preset, accent, accentText, density, radius, font, logoUrl };
    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify(prefs));
    applyPrefs(prefs);
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);
  };

  const handleReset = () => {
    const def = { preset: 'inspiratoria', accent: '#F5C800', accentText: '#0f0f0f', density: 'normal', radius: 'rounded', font: 'inter', logoUrl: '' };
    setPreset('inspiratoria'); setAccent('#F5C800'); setAccentText('#0f0f0f');
    setDensity('normal'); setRadius('rounded'); setFont('inter'); setLogoUrl('');
    const key = getStorageKey();
    localStorage.removeItem(key);
    applyPrefs(def);
  };

  // Derived preview color helpers
  const previewRadius = RADIUS.find(r => r.id === radius)?.px || '12px';
  const accentDim = accent + '22';

  return (
    <>
      {/* ── Configuración General ── */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">{Icons.settings} Configuración General</div>
        </div>
        <div className="section-body">
          <div className="input-row">
            <div className="input-group">
              <label className="input-label">Nombre de la Plataforma</label>
              <input type="text" className="input-field" value={settings.companyName}
                onChange={e => onSettingsChange({ ...settings, companyName: e.target.value })} placeholder="Inspiratoria" />
            </div>
            <div className="input-group">
              <label className="input-label">Zona Horaria</label>
              <select className="select-field" value={settings.timezone}
                onChange={e => onSettingsChange({ ...settings, timezone: e.target.value })}>
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
              <select className="select-field" value={settings.language}
                onChange={e => onSettingsChange({ ...settings, language: e.target.value })}>
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Formato de Fecha</label>
              <select className="select-field" value={settings.dateFormat}
                onChange={e => onSettingsChange({ ...settings, dateFormat: e.target.value })}>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button className="btn-primary" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
              {saved ? '✓ Guardado' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Personalización ── */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">{Icons.palette} Personalización de Interfaz</div>
          <span style={{ fontSize: '0.7rem', color: '#aaa', fontWeight: 500 }}>Solo para tu sesión</span>
        </div>
        <div className="section-body">
          <p className="section-desc">
            Ajusta la apariencia del dashboard a tu gusto. Los cambios se guardan en tu navegador y no afectan a otros usuarios.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>

            {/* ── Left: Controls ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Logo URL */}
              <div>
                <label className="input-label">Logo (URL)</label>
                <input type="url" className="input-field" placeholder="https://ejemplo.com/logo.png"
                  value={logoUrl} onChange={e => { setLogoUrl(e.target.value); setLogoErr(false); }} />
                {logoUrl && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img src={logoUrl} alt="logo preview" style={{ height: 28, maxWidth: 120, objectFit: 'contain', borderRadius: 4 }}
                      onError={() => setLogoErr(true)} onLoad={() => setLogoErr(false)} />
                    {logoErr && <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>URL inválida</span>}
                  </div>
                )}
              </div>

              {/* Presets */}
              <div>
                <label className="input-label" style={{ marginBottom: '0.6rem' }}>Tema de color</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {PRESETS.map(p => (
                    <button key={p.id} type="button" onClick={() => selectPreset(p)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                        padding: '0.65rem 0.5rem',
                        border: preset === p.id ? `2px solid ${p.accent}` : '2px solid #ebebeb',
                        borderRadius: 12, background: preset === p.id ? p.accent + '15' : '#fafafa',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: p.accent, boxShadow: preset === p.id ? `0 0 0 3px ${p.accent}40` : 'none', transition: 'box-shadow 0.15s' }} />
                      <span style={{ fontSize: '0.68rem', fontWeight: preset === p.id ? 700 : 500, color: preset === p.id ? '#0f0f0f' : '#888' }}>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom color */}
              <div>
                <label className="input-label">Color personalizado</label>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <input type="color" value={accent}
                    onChange={e => { setAccent(e.target.value); setPreset('custom'); }}
                    style={{ width: '2.5rem', height: '2.5rem', border: '1.5px solid #ebebeb', borderRadius: 8, cursor: 'pointer', padding: '2px' }} />
                  <input type="text" className="input-field" value={accent} style={{ flex: 1, fontFamily: 'monospace' }}
                    onChange={e => { setAccent(e.target.value); setPreset('custom'); }} placeholder="#F5C800" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label className="input-label" style={{ margin: 0 }}>Texto</label>
                    <input type="color" value={accentText}
                      onChange={e => setAccentText(e.target.value)}
                      style={{ width: '2.5rem', height: '2.5rem', border: '1.5px solid #ebebeb', borderRadius: 8, cursor: 'pointer', padding: '2px' }} />
                  </div>
                </div>
                <p style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '0.4rem' }}>El texto sobre botones y badges del color de acento.</p>
              </div>

              {/* Density */}
              <div>
                <label className="input-label" style={{ marginBottom: '0.6rem' }}>Densidad de interfaz</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {DENSITIES.map(d => (
                    <button key={d.id} type="button" onClick={() => setDensity(d.id)}
                      style={{
                        flex: 1, padding: '0.55rem 0.5rem',
                        border: density === d.id ? '2px solid #0f0f0f' : '2px solid #ebebeb',
                        borderRadius: 10, background: density === d.id ? '#0f0f0f' : '#fafafa',
                        cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                      }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: density === d.id ? '#fff' : '#0f0f0f' }}>{d.label}</div>
                      <div style={{ fontSize: '0.65rem', color: density === d.id ? '#ddd' : '#aaa', marginTop: '0.1rem' }}>{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <label className="input-label" style={{ marginBottom: '0.6rem' }}>Estilo de bordes</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {RADIUS.map(r => (
                    <button key={r.id} type="button" onClick={() => setRadius(r.id)}
                      style={{
                        flex: 1, padding: '0.55rem',
                        border: radius === r.id ? '2px solid #0f0f0f' : '2px solid #ebebeb',
                        borderRadius: r.px, background: radius === r.id ? '#0f0f0f' : '#fafafa',
                        cursor: 'pointer', transition: 'all 0.15s', fontSize: '0.75rem', fontWeight: 700,
                        color: radius === r.id ? '#fff' : '#888',
                      }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography */}
              <div>
                <label className="input-label" style={{ marginBottom: '0.6rem' }}>Tipografía</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {FONTS.map(f => (
                    <button key={f.id} type="button" onClick={() => setFont(f.id)}
                      style={{
                        padding: '0.6rem 0.5rem',
                        border: font === f.id ? '2px solid #0f0f0f' : '2px solid #ebebeb',
                        borderRadius: 10, background: font === f.id ? '#0f0f0f' : '#fafafa',
                        cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                      }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: font === f.id ? '#fff' : '#0f0f0f', fontFamily: `'${f.name}', sans-serif`, lineHeight: 1.2, marginBottom: '0.2rem' }}>{f.sample}</div>
                      <div style={{ fontSize: '0.62rem', color: font === f.id ? '#ddd' : '#888', fontWeight: 500 }}>{f.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right: Live Preview ── */}
            <div style={{ position: 'sticky', top: '5rem' }}>
              {/* Load Google Fonts for preview */}
              <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" />
              <div style={{ marginBottom: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="input-label" style={{ margin: 0 }}>Vista previa en tiempo real</label>
                <span style={{ fontSize: '0.65rem', color: '#aaa' }}>Se actualiza al instante</span>
              </div>

              {/* Preview card */}
              <div style={{ border: '1.5px solid #ebebeb', borderRadius: 16, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
                {/* Mock topnav */}
                <div style={{ height: 36, background: '#fff', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {logoUrl && !logoErr ? (
                      <img src={logoUrl} alt="" style={{ height: 16, maxWidth: 50, objectFit: 'contain' }} onError={() => setLogoErr(true)} />
                    ) : (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent }} />
                    )}
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#0f0f0f' }}>Dashboard</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e0e0e0' }} />
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e0e0e0' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', height: 180 }}>
                  {/* Sidebar */}
                  <div style={{ width: 36, background: '#0f0f0f', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 8 }}>
                    {[accent, '#555', '#555', '#555', '#555'].map((c, i) => (
                      <div key={i} style={{ width: i === 0 ? 20 : 16, height: i === 0 ? 20 : 14, borderRadius: previewRadius === '4px' ? 2 : previewRadius === '12px' ? 4 : 8, background: i === 0 ? accent : '#333' }} />
                    ))}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, padding: density === 'compact' ? '6px 8px' : density === 'spacious' ? '14px 12px' : '10px 10px', background: '#fff', display: 'flex', flexDirection: 'column', gap: density === 'compact' ? 4 : density === 'spacious' ? 10 : 7, fontFamily: FONT_MAP[font] }}>
                    {/* Eyebrow */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: accent }} />
                      <div style={{ width: 30, height: 4, borderRadius: 2, background: accentDim }} />
                    </div>
                    {/* Title */}
                    <div style={{ width: '55%', height: density === 'compact' ? 7 : 10, borderRadius: 3, background: '#0f0f0f' }} />

                    {/* KPI cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                      {[true, false, false].map((feat, i) => (
                        <div key={i} style={{
                          padding: density === 'compact' ? '4px 5px' : '6px 7px',
                          border: feat ? `1.5px solid ${accent}` : '1.5px solid #ebebeb',
                          borderRadius: previewRadius === '4px' ? 4 : previewRadius === '12px' ? 8 : 12,
                          background: feat ? accent + '15' : '#fafafa',
                        }}>
                          <div style={{ width: '60%', height: 3, borderRadius: 1, background: feat ? accent + '88' : '#ddd', marginBottom: 3 }} />
                          <div style={{ width: '40%', height: feat ? 9 : 7, borderRadius: 2, background: feat ? accent : '#ccc' }} />
                        </div>
                      ))}
                    </div>

                    {/* Table row */}
                    <div style={{ border: '1px solid #ebebeb', borderRadius: previewRadius === '4px' ? 4 : 8, padding: '5px 6px', display: 'flex', gap: 4, alignItems: 'center' }}>
                      <div style={{ width: 14, height: 14, borderRadius: previewRadius === '4px' ? 2 : 5, background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 6, height: 6, borderRadius: 1, background: accent }} />
                      </div>
                      <div style={{ flex: 1, height: 4, borderRadius: 1, background: '#e0e0e0' }} />
                      <div style={{ padding: '2px 5px', borderRadius: previewRadius === '4px' ? 2 : 99, background: accent, }}>
                        <div style={{ width: 14, height: 3, borderRadius: 1, background: accentText === '#ffffff' ? '#fff' : '#000' }} />
                      </div>
                    </div>

                    {/* Button preview */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 'auto' }}>
                      <div style={{ flex: 2, height: density === 'compact' ? 14 : 18, borderRadius: previewRadius === '4px' ? 3 : previewRadius === '12px' ? 6 : 12, background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 20, height: 3, borderRadius: 1, background: '#fff' }} />
                      </div>
                      <div style={{ flex: 1, height: density === 'compact' ? 14 : 18, borderRadius: previewRadius === '4px' ? 3 : previewRadius === '12px' ? 6 : 12, border: '1px solid #ebebeb', background: '#fafafa' }} />
                    </div>
                  </div>
                </div>

                {/* Preview label */}
                <div style={{ padding: '6px 10px', background: '#fafafa', borderTop: '1px solid #f0f0f0', fontSize: 8, color: '#aaa', textAlign: 'center', fontFamily: FONT_MAP[font] }}>
                  {PRESETS.find(p => p.id === preset)?.name || 'Custom'} · {DENSITIES.find(d => d.id === density)?.label} · {FONTS.find(f2 => f2.id === font)?.name}
                </div>
              </div>

              {/* Swatch strip */}
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', padding: '0.6rem', background: '#fafafa', borderRadius: 10, border: '1px solid #ebebeb' }}>
                {[accent, accent + '60', '#0f0f0f', '#f5f5f5', '#ebebeb'].map((c, i) => (
                  <div key={i} style={{ flex: 1, height: 20, borderRadius: 4, background: c, border: '1px solid rgba(0,0,0,0.06)' }} title={c} />
                ))}
                <span style={{ fontSize: '0.65rem', color: '#aaa', alignSelf: 'center', whiteSpace: 'nowrap', marginLeft: 2 }}>Paleta</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f0f0f0' }}>
            <button type="button" className="btn-outline" onClick={handleReset}>
              ↺ Restaurar por defecto
            </button>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {applied && (
                <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  ¡Cambios aplicados!
                </span>
              )}
              <button type="button" className="btn-primary" onClick={handleApply}>
                Aplicar Cambios
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
