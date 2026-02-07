import React, { useCallback } from 'react';
import type { MindMapConfig, ExportFormat } from '../../types';

interface ExportManagerProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  config: MindMapConfig;
  onExportConfigChange: (updates: Partial<MindMapConfig['export']>) => void;
}

const ExportManager: React.FC<ExportManagerProps> = ({ svgRef, config, onExportConfigChange }) => {
  const { export: expCfg } = config;

  const exportSVG = useCallback(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    // Clone SVG for export
    const clone = svgEl.cloneNode(true) as SVGSVGElement;

    // Set explicit dimensions for export
    const vb = svgEl.getAttribute('viewBox')?.split(' ').map(Number) || [0, 0, 800, 600];
    clone.setAttribute('width', String(vb[2]));
    clone.setAttribute('height', String(vb[3]));
    clone.setAttribute('viewBox', `0 0 ${vb[2]} ${vb[3]}`);

    // Embed fonts
    const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleEl.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    `;
    clone.insertBefore(styleEl, clone.firstChild);

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(clone);
    source = '<?xml version="1.0" standalone="no"?>\n' + source;

    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, 'mindmap.svg');
  }, [svgRef]);

  const exportImage = useCallback(
    (format: 'png' | 'jpeg') => {
      const svgEl = svgRef.current;
      if (!svgEl) return;

      const vb = svgEl.getAttribute('viewBox')?.split(' ').map(Number) || [0, 0, 800, 600];
      const scale = expCfg.scale;
      const w = vb[2] * scale;
      const h = vb[3] * scale;

      // Clone & serialize SVG
      const clone = svgEl.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('width', String(w));
      clone.setAttribute('height', String(h));
      clone.setAttribute('viewBox', `0 0 ${vb[2]} ${vb[3]}`);

      const serializer = new XMLSerializer();
      const source = serializer.serializeToString(clone);
      const encoded = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(source)));

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;

        // Background
        if (!expCfg.bgTransparent || format === 'jpeg') {
          ctx.fillStyle = expCfg.bgColor;
          ctx.fillRect(0, 0, w, h);
        }

        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob(
          (blob) => {
            if (blob) downloadBlob(blob, `mindmap.${format}`);
          },
          `image/${format}`,
          expCfg.quality
        );
      };
      img.src = encoded;
    },
    [svgRef, expCfg]
  );

  return (
    <div style={{ padding: '12px 0' }}>
      <h3 style={sectionTitle}>Export</h3>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Format</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['svg', 'png', 'jpeg'] as ExportFormat[]).map((fmt) => (
            <button
              key={fmt}
              onClick={() => onExportConfigChange({ format: fmt })}
              style={{
                ...chipStyle,
                background: expCfg.format === fmt ? '#4F46E5' : '#F1F5F9',
                color: expCfg.format === fmt ? '#FFF' : '#475569',
              }}
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {expCfg.format !== 'svg' && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>
              Scale: {expCfg.scale}x
            </label>
            <input
              type="range"
              min={1}
              max={8}
              step={1}
              value={expCfg.scale}
              onChange={(e) => onExportConfigChange({ scale: Number(e.target.value) })}
              style={rangeStyle}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={expCfg.bgTransparent}
                onChange={(e) => onExportConfigChange({ bgTransparent: e.target.checked })}
              />
              Transparent Background
            </label>
          </div>

          {expCfg.format === 'jpeg' && (
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Quality: {Math.round(expCfg.quality * 100)}%</label>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={expCfg.quality}
                onChange={(e) => onExportConfigChange({ quality: Number(e.target.value) })}
                style={rangeStyle}
              />
            </div>
          )}
        </>
      )}

      <button
        onClick={() => {
          if (expCfg.format === 'svg') exportSVG();
          else exportImage(expCfg.format as 'png' | 'jpeg');
        }}
        style={exportBtnStyle}
      >
        Export {expCfg.format.toUpperCase()}
      </button>
    </div>
  );
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const sectionTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#334155',
  marginBottom: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: '#64748B',
  marginBottom: 6,
  display: 'block',
};

const chipStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  transition: 'all 0.15s ease',
};

const rangeStyle: React.CSSProperties = {
  width: '100%',
  accentColor: '#4F46E5',
};

const exportBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 16px',
  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
  transition: 'all 0.2s ease',
  marginTop: 8,
};

export default React.memo(ExportManager);
