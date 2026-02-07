import type {
  MindMapNode,
  MindMapConfig,
  LayoutNode,
  LayoutEdge,
  LayoutResult,
} from '../types';
import { measureText } from '../utils/textMeasure';

// ─── Node Size Calculation ───────────────────────────────────────────────────

function calcNodeSize(
  node: MindMapNode,
  depth: number,
  config: MindMapConfig
): { width: number; height: number } {
  const fontSize =
    depth === 0
      ? config.style.rootFontSize
      : config.typography.levelFontSizes[Math.min(depth, config.typography.levelFontSizes.length - 1)];
  const fontWeight = depth === 0 ? 'bold' : config.typography.fontWeight;

  const measured = measureText(node.text, fontSize, config.typography.fontFamily, fontWeight);

  const textWidth = measured.width;
  const textHeight = measured.height;

  const paddingX = config.style.nodePaddingX;
  const paddingY = config.style.nodePaddingY;

  const iconSpace = node.icon ? 24 : 0;

  return {
    width: textWidth + paddingX * 2 + iconSpace,
    height: textHeight + paddingY * 2,
  };
}

// ─── Build Tree of LayoutNodes ───────────────────────────────────────────────

function buildLayoutTree(
  node: MindMapNode,
  depth: number,
  config: MindMapConfig,
  parent?: LayoutNode
): LayoutNode {
  const { width, height } = calcNodeSize(node, depth, config);
  const layoutNode: LayoutNode = {
    id: node.id,
    node,
    x: 0,
    y: 0,
    width,
    height,
    depth,
    parent,
    children: [],
  };

  if (!node.collapsed && depth < config.structure.maxDepth) {
    layoutNode.children = node.children.map((child) =>
      buildLayoutTree(child, depth + 1, config, layoutNode)
    );
  }

  return layoutNode;
}

// ─── Collect All Nodes & Edges ───────────────────────────────────────────────

function collectNodes(root: LayoutNode): LayoutNode[] {
  const nodes: LayoutNode[] = [root];
  for (const child of root.children) {
    nodes.push(...collectNodes(child));
  }
  return nodes;
}

function collectEdges(root: LayoutNode): LayoutEdge[] {
  const edges: LayoutEdge[] = [];
  for (const child of root.children) {
    edges.push({
      id: `${root.id}->${child.id}`,
      source: root,
      target: child,
      depth: child.depth,
    });
    edges.push(...collectEdges(child));
  }
  return edges;
}

// ─── Radial Layout ───────────────────────────────────────────────────────────

function computeSubtreeLeaves(node: LayoutNode): number {
  if (node.children.length === 0) return 1;
  let total = 0;
  for (const c of node.children) total += computeSubtreeLeaves(c);
  return total;
}

function layoutRadial(root: LayoutNode, config: MindMapConfig): void {
  root.x = -root.width / 2;
  root.y = -root.height / 2;

  const baseRing = config.structure.horizontalSpacing + 100;

  // Increase ring spacing for deeper levels to avoid crowding
  function radiusForDepth(depth: number): number {
    return depth * baseRing + (depth > 1 ? (depth - 1) * 30 : 0);
  }

  // Minimum angular gap between siblings to avoid overlap
  function minAngleForNode(node: LayoutNode, radius: number): number {
    const nodeSize = Math.max(node.width, node.height) + 16;
    return radius > 0 ? nodeSize / radius : 0.3;
  }

  function positionChildren(
    parent: LayoutNode,
    startAngle: number,
    endAngle: number,
  ) {
    if (parent.children.length === 0) return;

    const totalLeaves = computeSubtreeLeaves(parent);
    const angleSpan = endAngle - startAngle;

    // Compute the angle each child needs proportionally
    const childInfos = parent.children.map((child) => {
      const leaves = computeSubtreeLeaves(child);
      const r = radiusForDepth(child.depth);
      const minAngle = minAngleForNode(child, r);
      const proportional = (leaves / totalLeaves) * angleSpan;
      return { child, leaves, minAngle, angle: Math.max(proportional, minAngle) };
    });

    // Normalize if total exceeds span
    const totalAngle = childInfos.reduce((s, c) => s + c.angle, 0);
    const scale = totalAngle > angleSpan ? angleSpan / totalAngle : 1;

    let currentAngle = startAngle;
    for (const info of childInfos) {
      const childAngleSpan = info.angle * scale;
      const midAngle = currentAngle + childAngleSpan / 2;
      const r = radiusForDepth(info.child.depth);

      info.child.x = Math.cos(midAngle) * r - info.child.width / 2;
      info.child.y = Math.sin(midAngle) * r - info.child.height / 2;
      info.child.angle = midAngle;

      positionChildren(info.child, currentAngle, currentAngle + childAngleSpan);
      currentAngle += childAngleSpan;
    }
  }

  positionChildren(root, 0, Math.PI * 2);
}

// ─── Horizontal Right Layout (Tidy Tree) ────────────────────────────────────

function layoutHorizontalRight(root: LayoutNode, config: MindMapConfig): void {
  const hSpacing = config.structure.horizontalSpacing + 80;
  const vSpacing = config.structure.verticalSpacing + 8;

  function subtreeHeight(node: LayoutNode): number {
    if (node.children.length === 0) return node.height + vSpacing;
    let h = 0;
    for (const c of node.children) h += subtreeHeight(c);
    return Math.max(h, node.height + vSpacing);
  }

  function assign(node: LayoutNode, x: number, yStart: number): void {
    node.x = x;
    const totalH = subtreeHeight(node);
    node.y = yStart + totalH / 2 - node.height / 2;

    let childY = yStart;
    for (const child of node.children) {
      const childH = subtreeHeight(child);
      assign(child, x + hSpacing, childY);
      childY += childH;
    }
  }

  const totalH = subtreeHeight(root);
  assign(root, 0, -totalH / 2);
}

// ─── Horizontal Left Layout ─────────────────────────────────────────────────

function layoutHorizontalLeft(root: LayoutNode, config: MindMapConfig): void {
  layoutHorizontalRight(root, config);
  const nodes = collectNodes(root);
  for (const n of nodes) {
    n.x = -n.x - n.width;
  }
}

// ─── Vertical (Top-Down) Layout ──────────────────────────────────────────────

function layoutVertical(root: LayoutNode, config: MindMapConfig): void {
  const hSpacing = config.structure.horizontalSpacing + 10;
  const vSpacing = config.structure.verticalSpacing + 40;

  function subtreeWidth(node: LayoutNode): number {
    if (node.children.length === 0) return node.width + hSpacing;
    let w = 0;
    for (const c of node.children) w += subtreeWidth(c);
    return Math.max(w, node.width + hSpacing);
  }

  function assign(node: LayoutNode, xStart: number, y: number): void {
    const totalW = subtreeWidth(node);
    node.x = xStart + totalW / 2 - node.width / 2;
    node.y = y;

    let childX = xStart;
    for (const child of node.children) {
      const childW = subtreeWidth(child);
      assign(child, childX, y + vSpacing);
      childX += childW;
    }
  }

  const totalW = subtreeWidth(root);
  assign(root, -totalW / 2, 0);
}

// ─── Tree Layout (Balanced Left-Right) ───────────────────────────────────────

function layoutTree(root: LayoutNode, config: MindMapConfig): void {
  const hSpacing = config.structure.horizontalSpacing + 80;
  const vSpacing = config.structure.verticalSpacing + 12;

  root.x = -root.width / 2;
  root.y = -root.height / 2;

  // Balanced distribution: alternate children left/right for visual balance
  const rightChildren: LayoutNode[] = [];
  const leftChildren: LayoutNode[] = [];
  for (let i = 0; i < root.children.length; i++) {
    if (i % 2 === 0) {
      rightChildren.push(root.children[i]);
    } else {
      leftChildren.push(root.children[i]);
    }
  }

  function subtreeHeight(node: LayoutNode): number {
    if (node.children.length === 0) return node.height + vSpacing;
    let h = 0;
    for (const c of node.children) h += subtreeHeight(c);
    return Math.max(h, node.height + vSpacing);
  }

  function assignRight(node: LayoutNode, x: number, yStart: number): void {
    node.x = x;
    const totalH = subtreeHeight(node);
    node.y = yStart + totalH / 2 - node.height / 2;

    let childY = yStart;
    for (const child of node.children) {
      const childH = subtreeHeight(child);
      assignRight(child, x + hSpacing, childY);
      childY += childH;
    }
  }

  function assignLeft(node: LayoutNode, x: number, yStart: number): void {
    node.x = x - node.width;
    const totalH = subtreeHeight(node);
    node.y = yStart + totalH / 2 - node.height / 2;

    let childY = yStart;
    for (const child of node.children) {
      const childH = subtreeHeight(child);
      assignLeft(child, x - hSpacing, childY);
      childY += childH;
    }
  }

  // Position right children centered vertically
  let rightTotalH = 0;
  for (const c of rightChildren) rightTotalH += subtreeHeight(c);
  let rightY = -rightTotalH / 2;
  for (const child of rightChildren) {
    assignRight(child, root.x + root.width + hSpacing * 0.5, rightY);
    rightY += subtreeHeight(child);
  }

  // Position left children centered vertically
  let leftTotalH = 0;
  for (const c of leftChildren) leftTotalH += subtreeHeight(c);
  let leftY = -leftTotalH / 2;
  for (const child of leftChildren) {
    assignLeft(child, root.x - hSpacing * 0.5, leftY);
    leftY += subtreeHeight(child);
  }
}

// ─── Collision Resolution ────────────────────────────────────────────────────

function resolveCollisions(nodes: LayoutNode[], isRadial: boolean): void {
  const padding = 12;

  if (isRadial) {
    const byDepth = new Map<number, LayoutNode[]>();
    for (const n of nodes) {
      if (n.depth === 0) continue;
      const arr = byDepth.get(n.depth) || [];
      arr.push(n);
      byDepth.set(n.depth, arr);
    }

    for (const [, depthNodes] of byDepth) {
      depthNodes.sort((a, b) => (a.angle ?? 0) - (b.angle ?? 0));

      for (let pass = 0; pass < 5; pass++) {
        for (let i = 0; i < depthNodes.length; i++) {
          for (let j = i + 1; j < depthNodes.length; j++) {
            const a = depthNodes[i];
            const b = depthNodes[j];

            const overlapX = Math.min(a.x + a.width + padding, b.x + b.width + padding) - Math.max(a.x, b.x);
            const overlapY = Math.min(a.y + a.height + padding, b.y + b.height + padding) - Math.max(a.y, b.y);

            if (overlapX > 0 && overlapY > 0) {
              const aCx = a.x + a.width / 2;
              const aCy = a.y + a.height / 2;
              const bCx = b.x + b.width / 2;
              const bCy = b.y + b.height / 2;

              const dx = bCx - aCx;
              const dy = bCy - aCy;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;

              const pushDist = Math.min(overlapX, overlapY) / 2 + padding / 2;
              const px = (dx / dist) * pushDist;
              const py = (dy / dist) * pushDist;

              a.x -= px;
              a.y -= py;
              b.x += px;
              b.y += py;
            }
          }
        }
      }
    }
  } else {
    const byDepth = new Map<number, LayoutNode[]>();
    for (const n of nodes) {
      const arr = byDepth.get(n.depth) || [];
      arr.push(n);
      byDepth.set(n.depth, arr);
    }

    for (const [, depthNodes] of byDepth) {
      depthNodes.sort((a, b) => a.y - b.y);
      for (let i = 1; i < depthNodes.length; i++) {
        const prev = depthNodes[i - 1];
        const curr = depthNodes[i];
        const overlap = prev.y + prev.height + padding - curr.y;
        if (overlap > 0) {
          curr.y += overlap;
          shiftSubtree(curr, overlap);
        }
      }
    }
  }
}

function shiftSubtree(node: LayoutNode, dy: number): void {
  for (const child of node.children) {
    child.y += dy;
    shiftSubtree(child, dy);
  }
}

// ─── Compute Bounding Box ────────────────────────────────────────────────────

function computeBounds(nodes: LayoutNode[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }
  return { minX, minY, maxX, maxY };
}

// ─── Main Layout Function ────────────────────────────────────────────────────

export function computeLayout(
  rootNode: MindMapNode,
  config: MindMapConfig
): LayoutResult {
  const root = buildLayoutTree(rootNode, 0, config);

  switch (config.structure.layout) {
    case 'radial':
      layoutRadial(root, config);
      break;
    case 'horizontal-right':
      layoutHorizontalRight(root, config);
      break;
    case 'horizontal-left':
      layoutHorizontalLeft(root, config);
      break;
    case 'vertical':
      layoutVertical(root, config);
      break;
    case 'tree':
      layoutTree(root, config);
      break;
    default:
      layoutRadial(root, config);
  }

  const nodes = collectNodes(root);
  const isRadial = config.structure.layout === 'radial';
  resolveCollisions(nodes, isRadial);
  const edges = collectEdges(root);
  const bounds = computeBounds(nodes);

  const padding = config.export.padding;
  const width = bounds.maxX - bounds.minX + padding * 2;
  const height = bounds.maxY - bounds.minY + padding * 2;
  const offsetX = -bounds.minX + padding;
  const offsetY = -bounds.minY + padding;

  return { nodes, edges, width, height, offsetX, offsetY };
}
