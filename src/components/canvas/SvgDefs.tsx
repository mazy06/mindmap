import React from 'react';
import type { MindMapConfig, LayoutNode, MarkerShape } from '../../types';

interface SvgDefsProps {
  config: MindMapConfig;
  nodes: LayoutNode[];
}

const SvgDefs: React.FC<SvgDefsProps> = ({ config, nodes }) => {
  const { style, link } = config;
  const uniqueDepths = [...new Set(nodes.map((n) => n.depth))];

  // Collect all colors that edges might use for markers
  const markerColors = new Set<string>();
  if (link.colorByLevel) {
    for (const c of style.levelColors) markerColors.add(c);
  }
  markerColors.add(link.color);

  const hasStartMarker = link.markerStart !== 'none';
  const hasEndMarker = link.markerEnd !== 'none';
  const markerSize = link.markerSize;

  return (
    <defs>
      {/* Drop Shadow Filter */}
      {style.nodeShadow && (
        <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation={style.nodeShadowBlur / 2}
            floodColor={style.nodeShadowColor}
            floodOpacity="1"
          />
        </filter>
      )}

      {/* Glow filter for root */}
      <filter id="root-glow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow
          dx="0"
          dy="3"
          stdDeviation="6"
          floodColor={style.rootBgColor}
          floodOpacity="0.35"
        />
      </filter>

      {/* Node gradients per depth level */}
      {style.useGradients &&
        uniqueDepths.map((depth) => {
          const color = depth === 0
            ? style.rootBgColor
            : style.levelColors[
                (depth - 1) % style.levelColors.length
              ];
          return (
            <linearGradient
              key={`grad-${depth}`}
              id={`node-gradient-${depth}`}
              x1="0"
              y1="0"
              x2={style.gradientDirection === 'horizontal' ? '1' : '0'}
              y2={style.gradientDirection === 'horizontal' ? '0' : '1'}
            >
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={lightenColor(color, 0.15)} stopOpacity="1" />
            </linearGradient>
          );
        })}

      {/* Link animated dash */}
      {link.animated && (
        <style>
          {`
            @keyframes dash-flow {
              to { stroke-dashoffset: -20; }
            }
            .animated-link {
              animation: dash-flow ${link.animationSpeed}s linear infinite;
            }
          `}
        </style>
      )}

      {/* ─── Edge Markers ─── */}
      {hasEndMarker &&
        [...markerColors].map((color) => (
          <MarkerDef
            key={`end-${color}`}
            id={markerEndId(link.markerEnd, color)}
            shape={link.markerEnd}
            color={color}
            size={markerSize}
            isEnd={true}
          />
        ))}

      {hasStartMarker &&
        [...markerColors].map((color) => (
          <MarkerDef
            key={`start-${color}`}
            id={markerStartId(link.markerStart, color)}
            shape={link.markerStart}
            color={color}
            size={markerSize}
            isEnd={false}
          />
        ))}
    </defs>
  );
};

// ─── Marker Definition Component ─────────────────────────────────────────────
//
// The path in Edge.tsx already stops with a gap before the node.
// The marker is placed at that path endpoint.
//
// For END markers (orient="auto"): the marker's X axis points along the
// path direction toward the node. refX controls how far the marker shape
// is offset along that axis. We set refX=0 so the marker's left edge
// starts right at the path tip, and the shape extends forward (toward
// the node) into the gap.
//
// For START markers (orient="auto-start-reverse"): SVG reverses the
// marker so it points back toward the source. We use the same logic.
//
// For directional shapes (arrow, triangle), the tip points in the
// path direction (toward node).
// For symmetric shapes (square, diamond, circle, dot), center them.

const MarkerDef: React.FC<{
  id: string;
  shape: MarkerShape;
  color: string;
  size: number;
  isEnd: boolean;
}> = ({ id, shape, color, size, isEnd }) => {
  const s = size;
  const half = s / 2;

  let content: React.ReactNode;
  let viewBox: string;
  let refX: number;
  let refY: number;
  let mw: number;
  let mh: number;

  switch (shape) {
    case 'arrow':
      mw = s;
      mh = s;
      viewBox = `0 0 ${s} ${s}`;
      // Tip of the arrow is at x=s. Place it so the tip is at the path end.
      // refX = 0 means left edge of viewBox at path tip → arrow extends forward.
      refX = 0;
      refY = half;
      content = (
        <path
          d={`M 0 0 L ${s} ${half} L 0 ${s} Z`}
          fill={color}
        />
      );
      break;

    case 'triangle':
      mw = s;
      mh = s;
      viewBox = `0 0 ${s} ${s}`;
      refX = 0;
      refY = half;
      content = (
        <path
          d={`M 0 0 L ${s} ${half} L 0 ${s} Z`}
          fill={color}
          stroke={color}
          strokeWidth={0.5}
          strokeLinejoin="round"
        />
      );
      break;

    case 'square':
      mw = s;
      mh = s;
      viewBox = `0 0 ${s} ${s}`;
      refX = half;
      refY = half;
      content = (
        <rect x={0} y={0} width={s} height={s} fill={color} rx={1} />
      );
      break;

    case 'diamond':
      mw = s;
      mh = s;
      viewBox = `0 0 ${s} ${s}`;
      refX = half;
      refY = half;
      content = (
        <path
          d={`M ${half} 0 L ${s} ${half} L ${half} ${s} L 0 ${half} Z`}
          fill={color}
        />
      );
      break;

    case 'circle':
      mw = s;
      mh = s;
      viewBox = `0 0 ${s} ${s}`;
      refX = half;
      refY = half;
      content = (
        <circle cx={half} cy={half} r={half * 0.85} fill={color} />
      );
      break;

    case 'dot':
      mw = s;
      mh = s;
      viewBox = `0 0 ${s} ${s}`;
      refX = half;
      refY = half;
      content = (
        <circle cx={half} cy={half} r={half * 0.5} fill={color} />
      );
      break;

    default:
      return null;
  }

  return (
    <marker
      id={id}
      markerWidth={mw}
      markerHeight={mh}
      viewBox={viewBox}
      refX={refX}
      refY={refY}
      orient={isEnd ? 'auto' : 'auto-start-reverse'}
      markerUnits="userSpaceOnUse"
    >
      {content}
    </marker>
  );
};

// ─── Marker ID Helpers (exported for use in Edge) ────────────────────────────

function sanitizeColor(color: string): string {
  return color.replace(/[^a-zA-Z0-9]/g, '');
}

export function markerEndId(shape: MarkerShape, color: string): string {
  return `marker-end-${shape}-${sanitizeColor(color)}`;
}

export function markerStartId(shape: MarkerShape, color: string): string {
  return `marker-start-${shape}-${sanitizeColor(color)}`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * amount));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default React.memo(SvgDefs);
