// ─── Core Mind Map Types ─────────────────────────────────────────────────────

export interface MindMapNode {
  id: string;
  text: string;
  children: MindMapNode[];
  icon?: string;
  color?: string;
  bgColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  shape?: NodeShape;
  collapsed?: boolean;
  metadata?: Record<string, unknown>;
}

export type NodeShape = 'rounded-rect' | 'rect' | 'pill' | 'diamond' | 'ellipse' | 'hexagon';

export type LayoutType = 'radial' | 'horizontal-right' | 'horizontal-left' | 'vertical' | 'tree';

export type LinkStyle = 'bezier' | 'straight' | 'angular' | 'organic';

export type LinkStroke = 'solid' | 'dashed' | 'dotted';

export type MarkerShape = 'none' | 'arrow' | 'triangle' | 'square' | 'diamond' | 'circle' | 'dot';

export type ThemePreset = 'light' | 'dark' | 'minimal' | 'professional' | 'fun' | 'ocean' | 'forest' | 'sunset';

export type ExportFormat = 'svg' | 'png' | 'jpeg';

// ─── Computed Layout Position ────────────────────────────────────────────────

export interface LayoutNode {
  id: string;
  node: MindMapNode;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  parent?: LayoutNode;
  children: LayoutNode[];
  angle?: number; // for radial layout
}

export interface LayoutEdge {
  id: string;
  source: LayoutNode;
  target: LayoutNode;
  depth: number;
}

export interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

// ─── Configuration ───────────────────────────────────────────────────────────

export interface StyleConfig {
  // Global palette
  palette: string[];
  levelColors: string[];
  useGradients: boolean;
  gradientDirection: 'horizontal' | 'vertical' | 'radial';

  // Node styling
  nodeRadius: number;
  nodeBorderWidth: number;
  nodeBorderColor: string;
  nodeOpacity: number;
  nodeShadow: boolean;
  nodeShadowColor: string;
  nodeShadowBlur: number;
  nodePaddingX: number;
  nodePaddingY: number;
  nodeShape: NodeShape;

  // Root node
  rootBgColor: string;
  rootTextColor: string;
  rootFontSize: number;
  rootBorderRadius: number;

  // Background
  bgColor: string;
  bgTransparent: boolean;
}

export interface TypographyConfig {
  fontFamily: string;
  levelFontSizes: number[];
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right';
  textColor: string;
}

export interface StructureConfig {
  layout: LayoutType;
  horizontalSpacing: number;
  verticalSpacing: number;
  maxDepth: number;
  compactMode: boolean;
}

export interface LinkConfig {
  style: LinkStyle;
  stroke: LinkStroke;
  thickness: number;
  color: string;
  colorByLevel: boolean;
  animated: boolean;
  animationSpeed: number;
  tapered: boolean;
  markerStart: MarkerShape;
  markerEnd: MarkerShape;
  markerSize: number;
}

export interface ExportConfig {
  format: ExportFormat;
  scale: number;
  bgTransparent: boolean;
  bgColor: string;
  padding: number;
  quality: number; // 0-1 for JPEG
}

export interface MindMapConfig {
  style: StyleConfig;
  typography: TypographyConfig;
  structure: StructureConfig;
  link: LinkConfig;
  export: ExportConfig;
}
