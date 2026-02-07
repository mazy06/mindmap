import React from 'react';
import type { LayoutEdge, MindMapConfig } from '../../types';
import { markerEndId, markerStartId } from './SvgDefs';

interface EdgeProps {
  edge: LayoutEdge;
  config: MindMapConfig;
  offsetX: number;
  offsetY: number;
}

// ─── Anchor Points ──────────────────────────────────────────────────────────
//
// For tree/horizontal/vertical layouts: fixed anchors at the center of each side.
// For radial layout: dynamic boundary intersection toward the other node,
// ensuring each edge leaves/enters the node at the exact direction of its
// target/source. This prevents crossings when a parent has children spread
// across different angles.

type Anchor = 'top' | 'bottom' | 'left' | 'right';

function getFixedAnchorPoint(
  node: { x: number; y: number; width: number; height: number },
  anchor: Anchor,
  offsetX: number,
  offsetY: number,
): { x: number; y: number } {
  const nx = node.x + offsetX;
  const ny = node.y + offsetY;
  const cx = nx + node.width / 2;
  const cy = ny + node.height / 2;

  switch (anchor) {
    case 'top':    return { x: cx, y: ny };
    case 'bottom': return { x: cx, y: ny + node.height };
    case 'left':   return { x: nx, y: cy };
    case 'right':  return { x: nx + node.width, y: cy };
  }
}

// Compute the intersection of a ray from the center of a rectangle toward
// a target point, with the rectangle boundary. Returns the boundary point
// and the **face normal** at the hit edge (not the ray direction).
// The face normal is perpendicular to the hit edge and points outward,
// which produces proper curves when used as bezier control point direction.
function rectBoundaryPoint(
  node: { x: number; y: number; width: number; height: number },
  targetX: number,
  targetY: number,
  offsetX: number,
  offsetY: number,
): { x: number; y: number; dx: number; dy: number } {
  const nx = node.x + offsetX;
  const ny = node.y + offsetY;
  const cx = nx + node.width / 2;
  const cy = ny + node.height / 2;

  const dirX = targetX - cx;
  const dirY = targetY - cy;

  // Handle zero-distance edge case
  if (Math.abs(dirX) < 0.01 && Math.abs(dirY) < 0.01) {
    return { x: cx, y: ny, dx: 0, dy: -1 };
  }

  const halfW = node.width / 2;
  const halfH = node.height / 2;

  // Find which edge the ray hits first
  let t = Infinity;
  let hitEdge: 'right' | 'left' | 'bottom' | 'top' = 'right';

  if (dirX > 0) {
    const tt = halfW / dirX;
    if (tt < t) { t = tt; hitEdge = 'right'; }
  }
  if (dirX < 0) {
    const tt = -halfW / dirX;
    if (tt < t) { t = tt; hitEdge = 'left'; }
  }
  if (dirY > 0) {
    const tt = halfH / dirY;
    if (tt < t) { t = tt; hitEdge = 'bottom'; }
  }
  if (dirY < 0) {
    const tt = -halfH / dirY;
    if (tt < t) { t = tt; hitEdge = 'top'; }
  }

  const bx = cx + dirX * t;
  const by = cy + dirY * t;

  // Face normal: perpendicular to the hit edge, pointing outward.
  // This gives proper bezier curves that exit the node cleanly.
  let ndx: number, ndy: number;
  switch (hitEdge) {
    case 'right':  ndx = 1;  ndy = 0;  break;
    case 'left':   ndx = -1; ndy = 0;  break;
    case 'bottom': ndx = 0;  ndy = 1;  break;
    case 'top':    ndx = 0;  ndy = -1; break;
  }

  return { x: bx, y: by, dx: ndx, dy: ndy };
}

function chooseFixedAnchors(
  source: { x: number; y: number; width: number; height: number },
  target: { x: number; y: number; width: number; height: number },
  layout: string,
  offsetX: number,
  _offsetY: number,
): { sourceAnchor: Anchor; targetAnchor: Anchor } {
  if (layout === 'vertical') {
    return { sourceAnchor: 'bottom', targetAnchor: 'top' };
  }

  // Horizontal layouts + tree
  const sx = source.x + offsetX + source.width / 2;
  const tx = target.x + offsetX + target.width / 2;

  if (tx > sx) {
    return { sourceAnchor: 'right', targetAnchor: 'left' };
  } else {
    return { sourceAnchor: 'left', targetAnchor: 'right' };
  }
}

const Edge: React.FC<EdgeProps> = ({ edge, config, offsetX, offsetY }) => {
  const { link, style: styleConfig, structure } = config;
  const { source, target } = edge;

  const hasEnd = link.markerEnd !== 'none';
  const hasStart = link.markerStart !== 'none';
  const endGap = hasEnd ? link.markerSize + 3 : 4;
  const startGap = hasStart ? link.markerSize + 3 : 4;

  let x1: number, y1: number, x2: number, y2: number;
  let startDirX: number, startDirY: number, endDirX: number, endDirY: number;

  if (structure.layout === 'radial') {
    // ─── Radial: dynamic boundary intersection ────────────────────
    // Each edge exits the source toward the specific target and enters
    // the target from the specific source direction. This guarantees
    // no two edges from the same parent share an anchor direction,
    // preventing crossings.
    const srcCenter = {
      x: source.x + offsetX + source.width / 2,
      y: source.y + offsetY + source.height / 2,
    };
    const tgtCenter = {
      x: target.x + offsetX + target.width / 2,
      y: target.y + offsetY + target.height / 2,
    };

    const srcBP = rectBoundaryPoint(source, tgtCenter.x, tgtCenter.y, offsetX, offsetY);
    const tgtBP = rectBoundaryPoint(target, srcCenter.x, srcCenter.y, offsetX, offsetY);

    startDirX = srcBP.dx;
    startDirY = srcBP.dy;
    // Target direction points outward from target (away from source), so negate for "inward"
    endDirX = tgtBP.dx;
    endDirY = tgtBP.dy;

    x1 = srcBP.x + startDirX * startGap;
    y1 = srcBP.y + startDirY * startGap;
    x2 = tgtBP.x + endDirX * endGap;
    y2 = tgtBP.y + endDirY * endGap;
  } else {
    // ─── Tree/Horizontal/Vertical: fixed side anchors ─────────────
    const { sourceAnchor, targetAnchor } = chooseFixedAnchors(
      source, target, structure.layout, offsetX, offsetY
    );

    const p1 = getFixedAnchorPoint(source, sourceAnchor, offsetX, offsetY);
    const p2 = getFixedAnchorPoint(target, targetAnchor, offsetX, offsetY);

    const sDir = anchorDirection(sourceAnchor);
    const eDir = anchorDirection(targetAnchor);
    startDirX = sDir.dx;
    startDirY = sDir.dy;
    endDirX = eDir.dx;
    endDirY = eDir.dy;

    x1 = p1.x + startDirX * startGap;
    y1 = p1.y + startDirY * startGap;
    x2 = p2.x + endDirX * endGap;
    y2 = p2.y + endDirY * endGap;
  }

  // Build path — all curved styles use cubic bezier with control points
  // along the outward direction from each node boundary. This naturally
  // adapts to any node position (layout or drag & drop).
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  let d: string;

  switch (link.style) {
    case 'bezier': {
      const tension = Math.max(40, dist * 0.4);
      const cp1x = x1 + startDirX * tension;
      const cp1y = y1 + startDirY * tension;
      const cp2x = x2 + endDirX * tension;
      const cp2y = y2 + endDirY * tension;
      d = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
      break;
    }
    case 'straight':
      d = `M ${x1} ${y1} L ${x2} ${y2}`;
      break;
    case 'angular': {
      if (Math.abs(startDirY) > 0.5) {
        // Vertical exit: step down then across
        const midY = (y1 + y2) / 2;
        d = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
      } else {
        // Horizontal exit: step across then down
        const midX = (x1 + x2) / 2;
        d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
      }
      break;
    }
    case 'organic': {
      const tension = Math.max(50, dist * 0.55);
      const cp1x = x1 + startDirX * tension;
      const cp1y = y1 + startDirY * tension;
      const cp2x = x2 + endDirX * tension;
      const cp2y = y2 + endDirY * tension;
      d = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
      break;
    }
    default:
      d = `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  // Color
  const edgeColor = link.colorByLevel
    ? styleConfig.levelColors[(edge.depth - 1) % styleConfig.levelColors.length]
    : link.color;

  // Stroke width (tapered: thicker near root, thinner at leaves)
  const strokeWidth = link.tapered
    ? Math.max(1.5, link.thickness - edge.depth * 0.5)
    : link.thickness;

  // Dash
  let strokeDasharray: string | undefined;
  if (link.stroke === 'dashed') strokeDasharray = '8 4';
  else if (link.stroke === 'dotted') strokeDasharray = '3 3';

  // Markers
  const markerEndAttr = hasEnd
    ? `url(#${markerEndId(link.markerEnd, edgeColor)})`
    : undefined;
  const markerStartAttr = hasStart
    ? `url(#${markerStartId(link.markerStart, edgeColor)})`
    : undefined;

  return (
    <path
      d={d}
      fill="none"
      stroke={edgeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={strokeDasharray}
      opacity={0.85}
      markerEnd={markerEndAttr}
      markerStart={markerStartAttr}
      className={link.animated ? 'animated-link' : undefined}
      style={link.animated ? { strokeDasharray: '10 10' } : undefined}
    />
  );
};

// Direction vector pointing outward from a fixed anchor
function anchorDirection(anchor: Anchor): { dx: number; dy: number } {
  switch (anchor) {
    case 'top':    return { dx: 0, dy: -1 };
    case 'bottom': return { dx: 0, dy: 1 };
    case 'left':   return { dx: -1, dy: 0 };
    case 'right':  return { dx: 1, dy: 0 };
  }
}

export default React.memo(Edge);
