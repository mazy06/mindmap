import React, { useState } from 'react';
import type { MindMapConfig, ThemePreset, LayoutType, LinkStyle, LinkStroke, NodeShape, MarkerShape } from '../../types';
import ExportManager from '../export/ExportManager';

type Tab = 'style' | 'typography' | 'structure' | 'links' | 'export';

interface ControlsPanelProps {
  config: MindMapConfig;
  onConfigChange: (config: MindMapConfig) => void;
  onThemeChange: (theme: ThemePreset) => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
  activeTheme: ThemePreset;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  config,
  onConfigChange,
  onThemeChange,
  svgRef,
  activeTheme,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('style');

  const updateStyle = (updates: Partial<MindMapConfig['style']>) =>
    onConfigChange({ ...config, style: { ...config.style, ...updates } });

  const updateTypo = (updates: Partial<MindMapConfig['typography']>) =>
    onConfigChange({ ...config, typography: { ...config.typography, ...updates } });

  const updateStructure = (updates: Partial<MindMapConfig['structure']>) =>
    onConfigChange({ ...config, structure: { ...config.structure, ...updates } });

  const updateLink = (updates: Partial<MindMapConfig['link']>) =>
    onConfigChange({ ...config, link: { ...config.link, ...updates } });

  const updateExport = (updates: Partial<MindMapConfig['export']>) =>
    onConfigChange({ ...config, export: { ...config.export, ...updates } });

  const tabs: { key: Tab; label: string }[] = [
    { key: 'style', label: 'Style' },
    { key: 'typography', label: 'Typo' },
    { key: 'structure', label: 'Layout' },
    { key: 'links', label: 'Links' },
    { key: 'export', label: 'Export' },
  ];

  return (
    <div style={panelContainer}>
      {/* Tab navigation */}
      <div style={tabBar}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              ...tabBtn,
              background: activeTab === t.key ? '#4F46E5' : 'transparent',
              color: activeTab === t.key ? '#FFF' : '#64748B',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={scrollArea}>
        {/* ─── STYLE TAB ─── */}
        {activeTab === 'style' && (
          <div>
            <Section title="Theme">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(
                  ['light', 'dark', 'minimal', 'professional', 'fun', 'ocean', 'forest', 'sunset'] as ThemePreset[]
                ).map((t) => (
                  <button
                    key={t}
                    onClick={() => onThemeChange(t)}
                    style={{
                      ...chipBtn,
                      background: activeTheme === t ? '#4F46E5' : '#F1F5F9',
                      color: activeTheme === t ? '#FFF' : '#475569',
                    }}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Node Shape">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(['rounded-rect', 'rect', 'pill', 'ellipse', 'diamond', 'hexagon'] as NodeShape[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStyle({ nodeShape: s })}
                    style={{
                      ...chipBtn,
                      background: config.style.nodeShape === s ? '#4F46E5' : '#F1F5F9',
                      color: config.style.nodeShape === s ? '#FFF' : '#475569',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Colors">
              <Row label="Root Background">
                <ColorInput value={config.style.rootBgColor} onChange={(v) => updateStyle({ rootBgColor: v })} />
              </Row>
              <Row label="Root Text">
                <ColorInput value={config.style.rootTextColor} onChange={(v) => updateStyle({ rootTextColor: v })} />
              </Row>
              <Row label="Background">
                <ColorInput value={config.style.bgColor} onChange={(v) => updateStyle({ bgColor: v })} />
              </Row>
            </Section>

            <Section title="Level Colors">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {config.style.levelColors.map((c, i) => (
                  <ColorInput
                    key={i}
                    value={c}
                    onChange={(v) => {
                      const updated = [...config.style.levelColors];
                      updated[i] = v;
                      updateStyle({ levelColors: updated });
                    }}
                  />
                ))}
              </div>
            </Section>

            <Section title="Appearance">
              <Row label={`Border Radius: ${config.style.nodeRadius}px`}>
                <Slider value={config.style.nodeRadius} min={0} max={30} onChange={(v) => updateStyle({ nodeRadius: v })} />
              </Row>
              <Row label={`Border Width: ${config.style.nodeBorderWidth}px`}>
                <Slider value={config.style.nodeBorderWidth} min={0} max={6} step={0.5} onChange={(v) => updateStyle({ nodeBorderWidth: v })} />
              </Row>
              <Row label={`Opacity: ${config.style.nodeOpacity}`}>
                <Slider value={config.style.nodeOpacity} min={0.3} max={1} step={0.05} onChange={(v) => updateStyle({ nodeOpacity: v })} />
              </Row>
              <Toggle label="Gradients" checked={config.style.useGradients} onChange={(v) => updateStyle({ useGradients: v })} />
              <Toggle label="Shadows" checked={config.style.nodeShadow} onChange={(v) => updateStyle({ nodeShadow: v })} />
              {config.style.nodeShadow && (
                <Row label={`Shadow Blur: ${config.style.nodeShadowBlur}`}>
                  <Slider
                    value={config.style.nodeShadowBlur}
                    min={1}
                    max={20}
                    onChange={(v) => updateStyle({ nodeShadowBlur: v })}
                  />
                </Row>
              )}
            </Section>
          </div>
        )}

        {/* ─── TYPOGRAPHY TAB ─── */}
        {activeTab === 'typography' && (
          <div>
            <Section title="Font">
              <Row label="Font Family">
                <select
                  value={config.typography.fontFamily}
                  onChange={(e) => updateTypo({ fontFamily: e.target.value })}
                  style={selectStyle}
                >
                  {fontOptions.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="Text Color">
                <ColorInput value={config.typography.textColor} onChange={(v) => updateTypo({ textColor: v })} />
              </Row>
            </Section>

            <Section title="Size by Level">
              {config.typography.levelFontSizes.map((size, i) => (
                <Row key={i} label={`Level ${i}: ${size}px`}>
                  <Slider
                    value={size}
                    min={8}
                    max={32}
                    onChange={(v) => {
                      const updated = [...config.typography.levelFontSizes];
                      updated[i] = v;
                      updateTypo({ levelFontSizes: updated });
                    }}
                  />
                </Row>
              ))}
            </Section>

            <Section title="Style">
              <Row label="Weight">
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['normal', 'bold'] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => updateTypo({ fontWeight: w })}
                      style={{
                        ...chipBtn,
                        background: config.typography.fontWeight === w ? '#4F46E5' : '#F1F5F9',
                        color: config.typography.fontWeight === w ? '#FFF' : '#475569',
                        fontWeight: w === 'bold' ? 700 : 400,
                      }}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </Row>
              <Row label={`Line Height: ${config.typography.lineHeight}`}>
                <Slider value={config.typography.lineHeight} min={1} max={2} step={0.1} onChange={(v) => updateTypo({ lineHeight: v })} />
              </Row>
            </Section>

            <Section title="Root Node">
              <Row label={`Root Font Size: ${config.style.rootFontSize}px`}>
                <Slider value={config.style.rootFontSize} min={14} max={36} onChange={(v) => updateStyle({ rootFontSize: v })} />
              </Row>
              <Row label={`Root Border Radius: ${config.style.rootBorderRadius}px`}>
                <Slider value={config.style.rootBorderRadius} min={0} max={30} onChange={(v) => updateStyle({ rootBorderRadius: v })} />
              </Row>
            </Section>
          </div>
        )}

        {/* ─── STRUCTURE TAB ─── */}
        {activeTab === 'structure' && (
          <div>
            <Section title="Layout Type">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(
                  [
                    { key: 'radial', label: 'Radial' },
                    { key: 'horizontal-right', label: 'Right' },
                    { key: 'horizontal-left', label: 'Left' },
                    { key: 'vertical', label: 'Vertical' },
                    { key: 'tree', label: 'Tree' },
                  ] as { key: LayoutType; label: string }[]
                ).map((l) => (
                  <button
                    key={l.key}
                    onClick={() => updateStructure({ layout: l.key })}
                    style={{
                      ...chipBtn,
                      background: config.structure.layout === l.key ? '#4F46E5' : '#F1F5F9',
                      color: config.structure.layout === l.key ? '#FFF' : '#475569',
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Spacing">
              <Row label={`Horizontal: ${config.structure.horizontalSpacing}px`}>
                <Slider
                  value={config.structure.horizontalSpacing}
                  min={20}
                  max={200}
                  onChange={(v) => updateStructure({ horizontalSpacing: v })}
                />
              </Row>
              <Row label={`Vertical: ${config.structure.verticalSpacing}px`}>
                <Slider
                  value={config.structure.verticalSpacing}
                  min={10}
                  max={100}
                  onChange={(v) => updateStructure({ verticalSpacing: v })}
                />
              </Row>
              <Row label={`Max Depth: ${config.structure.maxDepth}`}>
                <Slider
                  value={config.structure.maxDepth}
                  min={1}
                  max={12}
                  onChange={(v) => updateStructure({ maxDepth: v })}
                />
              </Row>
            </Section>
          </div>
        )}

        {/* ─── LINKS TAB ─── */}
        {activeTab === 'links' && (
          <div>
            <Section title="Link Style">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(['bezier', 'straight', 'angular', 'organic'] as LinkStyle[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateLink({ style: s })}
                    style={{
                      ...chipBtn,
                      background: config.link.style === s ? '#4F46E5' : '#F1F5F9',
                      color: config.link.style === s ? '#FFF' : '#475569',
                    }}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Stroke">
              <div style={{ display: 'flex', gap: 6 }}>
                {(['solid', 'dashed', 'dotted'] as LinkStroke[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateLink({ stroke: s })}
                    style={{
                      ...chipBtn,
                      background: config.link.stroke === s ? '#4F46E5' : '#F1F5F9',
                      color: config.link.stroke === s ? '#FFF' : '#475569',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Appearance">
              <Row label={`Thickness: ${config.link.thickness}px`}>
                <Slider value={config.link.thickness} min={0.5} max={6} step={0.5} onChange={(v) => updateLink({ thickness: v })} />
              </Row>
              <Row label="Link Color">
                <ColorInput value={config.link.color} onChange={(v) => updateLink({ color: v })} />
              </Row>
              <Toggle label="Color by Level" checked={config.link.colorByLevel} onChange={(v) => updateLink({ colorByLevel: v })} />
              <Toggle label="Tapered" checked={config.link.tapered} onChange={(v) => updateLink({ tapered: v })} />
              <Toggle label="Animated" checked={config.link.animated} onChange={(v) => updateLink({ animated: v })} />
              {config.link.animated && (
                <Row label={`Speed: ${config.link.animationSpeed}s`}>
                  <Slider
                    value={config.link.animationSpeed}
                    min={0.5}
                    max={5}
                    step={0.5}
                    onChange={(v) => updateLink({ animationSpeed: v })}
                  />
                </Row>
              )}
            </Section>

            <Section title="Markers">
              <Row label="Start Marker">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(['none', 'arrow', 'triangle', 'square', 'diamond', 'circle', 'dot'] as MarkerShape[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateLink({ markerStart: s })}
                      style={{
                        ...chipBtn,
                        background: config.link.markerStart === s ? '#4F46E5' : '#F1F5F9',
                        color: config.link.markerStart === s ? '#FFF' : '#475569',
                      }}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </Row>
              <Row label="End Marker">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(['none', 'arrow', 'triangle', 'square', 'diamond', 'circle', 'dot'] as MarkerShape[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateLink({ markerEnd: s })}
                      style={{
                        ...chipBtn,
                        background: config.link.markerEnd === s ? '#4F46E5' : '#F1F5F9',
                        color: config.link.markerEnd === s ? '#FFF' : '#475569',
                      }}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </Row>
              <Row label={`Marker Size: ${config.link.markerSize}px`}>
                <Slider value={config.link.markerSize} min={4} max={20} onChange={(v) => updateLink({ markerSize: v })} />
              </Row>
            </Section>
          </div>
        )}

        {/* ─── EXPORT TAB ─── */}
        {activeTab === 'export' && (
          <ExportManager svgRef={svgRef} config={config} onExportConfigChange={updateExport} />
        )}
      </div>
    </div>
  );
};

// ─── Reusable Sub-components ─────────────────────────────────────────────────

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <h3 style={sectionTitleStyle}>{title}</h3>
    {children}
  </div>
);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 10 }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
);

const Slider: React.FC<{
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}> = ({ value, min, max, step = 1, onChange }) => (
  <input
    type="range"
    min={min}
    max={max}
    step={step}
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
    style={{ width: '100%', accentColor: '#4F46E5' }}
  />
);

const Toggle: React.FC<{
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <label
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
      cursor: 'pointer',
      fontSize: 12,
      color: '#475569',
    }}
  >
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        background: checked ? '#4F46E5' : '#CBD5E1',
        position: 'relative',
        transition: 'background 0.2s ease',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          background: '#FFF',
          position: 'absolute',
          top: 2,
          left: checked ? 18 : 2,
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }}
      />
    </div>
    {label}
  </label>
);

const ColorInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => (
  <input
    type="color"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{
      width: 32,
      height: 32,
      border: '2px solid #E2E8F0',
      borderRadius: 8,
      cursor: 'pointer',
      padding: 2,
      background: 'transparent',
    }}
  />
);

const fontOptions = [
  { label: 'Inter', value: "'Inter', system-ui, sans-serif" },
  { label: 'System UI', value: "system-ui, -apple-system, sans-serif" },
  { label: 'Georgia', value: "'Georgia', 'Times New Roman', serif" },
  { label: 'Menlo (Mono)', value: "'Menlo', 'Consolas', monospace" },
  { label: 'Nunito', value: "'Nunito', sans-serif" },
  { label: 'Arial', value: "'Arial', 'Helvetica', sans-serif" },
];

// ─── Styles ──────────────────────────────────────────────────────────────────

const panelContainer: React.CSSProperties = {
  width: 300,
  height: '100%',
  background: '#FFFFFF',
  borderLeft: '1px solid #E2E8F0',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  flexShrink: 0,
};

const tabBar: React.CSSProperties = {
  display: 'flex',
  gap: 2,
  padding: '8px 8px 0',
  background: '#F8FAFC',
  borderBottom: '1px solid #E2E8F0',
};

const tabBtn: React.CSSProperties = {
  flex: 1,
  padding: '8px 4px',
  border: 'none',
  borderRadius: '8px 8px 0 0',
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: 600,
  transition: 'all 0.15s ease',
};

const scrollArea: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: '16px 14px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#94A3B8',
  marginBottom: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: '#64748B',
  marginBottom: 4,
  display: 'block',
};

const chipBtn: React.CSSProperties = {
  padding: '5px 12px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: 600,
  transition: 'all 0.15s ease',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  borderRadius: 8,
  border: '1px solid #E2E8F0',
  fontSize: 12,
  color: '#334155',
  background: '#F8FAFC',
  cursor: 'pointer',
};

export default React.memo(ControlsPanel);
