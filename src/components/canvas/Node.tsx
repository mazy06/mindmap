import React, { useCallback } from 'react';
import type { LayoutNode, MindMapConfig } from '../../types';

interface NodeProps {
  layoutNode: LayoutNode;
  config: MindMapConfig;
  offsetX: number;
  offsetY: number;
  onToggleCollapse?: (id: string) => void;
  onSelectNode?: (id: string) => void;
  selectedNodeId?: string | null;
  onDragStart?: (nodeId: string, clientX: number, clientY: number) => void;
  isDragging?: boolean;
}

const MindMapNodeComponent: React.FC<NodeProps> = ({
  layoutNode,
  config,
  offsetX,
  offsetY,
  onToggleCollapse,
  onSelectNode,
  selectedNodeId,
  onDragStart,
  isDragging,
}) => {
  const { node, x, y, width, height, depth } = layoutNode;
  const { style, typography } = config;
  const isRoot = depth === 0;
  const isSelected = selectedNodeId === node.id;

  const px = x + offsetX;
  const py = y + offsetY;

  // Colors
  const bgColor = isRoot
    ? style.rootBgColor
    : node.bgColor || style.levelColors[(depth - 1) % style.levelColors.length];

  const textColor = isRoot
    ? style.rootTextColor
    : node.color || (isLightColor(bgColor) ? '#1E293B' : '#FFFFFF');

  const fontSize = isRoot
    ? style.rootFontSize
    : node.fontSize || typography.levelFontSizes[Math.min(depth, typography.levelFontSizes.length - 1)];

  const fontWeight = isRoot ? 'bold' : (node.fontWeight || typography.fontWeight);
  const fontStyle = node.fontStyle || typography.fontStyle;
  const borderRadius = isRoot ? style.rootBorderRadius : style.nodeRadius;

  // Fill: gradient or solid
  const fill = style.useGradients ? `url(#node-gradient-${depth})` : bgColor;

  // Shape path
  const shapePath = getShapePath(style.nodeShape, width, height, borderRadius);

  // Filter
  const filter = isRoot ? 'url(#root-glow)' : style.nodeShadow ? 'url(#node-shadow)' : undefined;

  // ─── Drag initiation on mousedown ──────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only left button
      if (e.button !== 0) return;
      e.stopPropagation(); // Prevent canvas pan
      onDragStart?.(node.id, e.clientX, e.clientY);
      onSelectNode?.(node.id);
    },
    [node.id, onDragStart, onSelectNode]
  );

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.children && node.children.length > 0) {
      onToggleCollapse?.(node.id);
    }
  }, [node.id, node.children, onToggleCollapse]);

  const textX = node.icon
    ? style.nodePaddingX + 22
    : width / 2;

  return (
    <g
      transform={`translate(${px}, ${py})`}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
      role="treeitem"
      aria-label={node.text}
      opacity={isDragging ? 0.85 : 1}
    >
      {/* Node shape */}
      <path
        d={shapePath}
        fill={fill}
        stroke={isDragging ? '#3B82F6' : isSelected ? '#3B82F6' : style.nodeBorderColor}
        strokeWidth={isDragging ? 3 : isSelected ? 3 : style.nodeBorderWidth}
        opacity={style.nodeOpacity}
        filter={filter}
        rx={borderRadius}
        ry={borderRadius}
      />

      {/* Icon */}
      {node.icon && (
        <text
          x={style.nodePaddingX - 2}
          y={height / 2}
          dominantBaseline="central"
          fontSize={fontSize + 2}
          fill={textColor}
          pointerEvents="none"
        >
          {node.icon}
        </text>
      )}

      {/* Text — single line, node width adapts */}
      <text
        x={textX}
        y={height / 2}
        textAnchor={node.icon ? 'start' : 'middle'}
        dominantBaseline="central"
        fill={textColor}
        fontSize={fontSize}
        fontFamily={typography.fontFamily}
        fontWeight={fontWeight}
        fontStyle={fontStyle}
        pointerEvents="none"
      >
        {node.text}
      </text>

      {/* Collapse indicator */}
      {node.children && node.children.length > 0 && !isRoot && (
        <g transform={`translate(${width - 8}, ${height - 8})`}>
          <circle
            r={7}
            fill={bgColor}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={1}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill={textColor}
            fontSize={9}
            fontWeight="bold"
            pointerEvents="none"
          >
            {node.collapsed ? '+' : node.children.length}
          </text>
        </g>
      )}
    </g>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getShapePath(
  shape: string,
  w: number,
  h: number,
  r: number
): string {
  switch (shape) {
    case 'pill':
      return roundedRectPath(w, h, h / 2);
    case 'rect':
      return roundedRectPath(w, h, 0);
    case 'diamond': {
      const cx = w / 2, cy = h / 2;
      return `M ${cx} 0 L ${w} ${cy} L ${cx} ${h} L 0 ${cy} Z`;
    }
    case 'ellipse': {
      const rx = w / 2, ry = h / 2;
      return `M ${rx} 0 A ${rx} ${ry} 0 1 1 ${rx} ${h} A ${rx} ${ry} 0 1 1 ${rx} 0 Z`;
    }
    case 'hexagon': {
      const inset = w * 0.15;
      return `M ${inset} 0 L ${w - inset} 0 L ${w} ${h / 2} L ${w - inset} ${h} L ${inset} ${h} L 0 ${h / 2} Z`;
    }
    case 'rounded-rect':
    default:
      return roundedRectPath(w, h, r);
  }
}

function roundedRectPath(w: number, h: number, r: number): string {
  r = Math.min(r, w / 2, h / 2);
  return `M ${r} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h - r} Q ${w} ${h} ${w - r} ${h} L ${r} ${h} Q 0 ${h} 0 ${h - r} L 0 ${r} Q 0 0 ${r} 0 Z`;
}

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

export default React.memo(MindMapNodeComponent);
