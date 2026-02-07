import React from 'react';
import type { LayoutEdge, MindMapConfig } from '../../types';
import { markerEndId, markerStartId } from './SvgDefs';

interface EdgeProps {
  edge: LayoutEdge;
  config: MindMapConfig;
  offsetX: number;
  offsetY: number;
}

// ─── Fixed Anchor Points ─────────────────────────────────────────────────────
//
// Each node has 4 anchor points at the center of each side:
//   top:    (cx, y)
//   bottom: (cx, y + h)
//   left:   (x, cy)
//   right:  (x + w, cy)
//
// The anchor is chosen based on the layout type. Markers always sit at these
// fixed positions. The path adapts to connect between the two anchors.

type Anchor = 'top' | 'bottom' | 'left' | 'right';

function getAnchorPoint(
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

function chooseAnchors(
  source: { x: number; y: number; width: number; height: number },
  target: { x: number; y: number; width: number; height: number },
  layout: string,
  offsetX: number,
  offsetY: number,
): { sourceAnchor: Anchor; targetAnchor: Anchor } {
  if (layout === 'vertical') {
    return { sourceAnchor: 'bottom', targetAnchor: 'top' };
  }

  if (layout === 'radial') {
    // For radial: pick the side that faces the target/source
    const sx = source.x + offsetX + source.width / 2;
    const sy = source.y + offsetY + source.height / 2;
    const tx = target.x + offsetX + target.width / 2;
    const ty = target.y + offsetY + target.height / 2;

    const angle = Math.atan2(ty - sy, tx - sx);
    const absAngle = Math.abs(angle);

    // Determine which side of the source faces the target
    let sourceAnchor: Anchor;
    let targetAnchor: Anchor;

    if (absAngle < Math.PI / 4) {
      sourceAnchor = 'right';
      targetAnchor = 'left';
    } else if (absAngle > (3 * Math.PI) / 4) {
      sourceAnchor = 'left';
      targetAnchor = 'right';
    } else if (angle > 0) {
      sourceAnchor = 'bottom';
      targetAnchor = 'top';
    } else {
      sourceAnchor = 'top';
      targetAnchor = 'bottom';
    }

    return { sourceAnchor, targetAnchor };
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

  // Choose fixed anchor points
  const { sourceAnchor, targetAnchor } = chooseAnchors(
    source, target, structure.layout, offsetX, offsetY
  );

  // Get the exact anchor coordinates on the node borders
  const p1 = getAnchorPoint(source, sourceAnchor, offsetX, offsetY);
  const p2 = getAnchorPoint(target, targetAnchor, offsetX, offsetY);

  // Apply gap: pull the path endpoints away from the node by gap distance
  const hasEnd = link.markerEnd !== 'none';
  const hasStart = link.markerStart !== 'none';
  const endGap = hasEnd ? link.markerSize + 3 : 4;
  const startGap = hasStart ? link.markerSize + 3 : 4;

  // Direction vectors from anchor outward
  const startDir = anchorDirection(sourceAnchor);
  const endDir = anchorDirection(targetAnchor);

  const x1 = p1.x + startDir.dx * startGap;
  const y1 = p1.y + startDir.dy * startGap;
  const x2 = p2.x + endDir.dx * endGap;
  const y2 = p2.y + endDir.dy * endGap;

  // Build path that respects the anchor directions
  const dx = x2 - x1;
  const dy = y2 - y1;
  let d: string;

  switch (link.style) {
    case 'bezier': {
      const dist = Math.sqrt(dx * dx + dy * dy);
      const tension = dist * 0.4;
      const cp1x = x1 + startDir.dx * tension;
      const cp1y = y1 + startDir.dy * tension;
      const cp2x = x2 + endDir.dx * tension;
      const cp2y = y2 + endDir.dy * tension;
      d = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
      break;
    }
    case 'straight':
      d = `M ${x1} ${y1} L ${x2} ${y2}`;
      break;
    case 'angular': {
      // Step path: go out from source anchor, then turn to target
      if (sourceAnchor === 'bottom' || sourceAnchor === 'top') {
        const midY = (y1 + y2) / 2;
        d = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
      } else {
        const midX = (x1 + x2) / 2;
        d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
      }
      break;
    }
    case 'organic': {
      const dist = Math.sqrt(dx * dx + dy * dy);
      const tension = dist * 0.55;
      const cp1x = x1 + startDir.dx * tension;
      const cp1y = y1 + startDir.dy * tension;
      const cp2x = x2 + endDir.dx * tension;
      const cp2y = y2 + endDir.dy * tension;
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

// Direction vector pointing outward from an anchor
function anchorDirection(anchor: Anchor): { dx: number; dy: number } {
  switch (anchor) {
    case 'top':    return { dx: 0, dy: -1 };
    case 'bottom': return { dx: 0, dy: 1 };
    case 'left':   return { dx: -1, dy: 0 };
    case 'right':  return { dx: 1, dy: 0 };
  }
}

export default React.memo(Edge);
