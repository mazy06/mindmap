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

  const baseRing = config.structure.horizontalSpacing + 120;

  // Progressive ring spacing to give deeper levels more room
  function radiusForDepth(depth: number): number {
    return depth * baseRing + (depth > 1 ? (depth - 1) * 40 : 0);
  }

  // Minimum angular space a subtree needs, considering all descendants
  function minSubtreeAngle(node: LayoutNode): number {
    const r = radiusForDepth(node.depth);
    const nodeArc = r > 0 ? (Math.max(node.width, node.height) + 20) / r : 0.3;

    if (node.children.length === 0) return nodeArc;

    let childrenTotal = 0;
    for (const c of node.children) {
      childrenTotal += minSubtreeAngle(c);
    }

    return Math.max(nodeArc, childrenTotal);
  }

  function positionChildren(
    parent: LayoutNode,
    startAngle: number,
    endAngle: number,
  ) {
    if (parent.children.length === 0) return;

    const angleSpan = endAngle - startAngle;

    // Compute the angle each child subtree needs
    const childInfos = parent.children.map((child) => {
      const leaves = computeSubtreeLeaves(child);
      const minAngle = minSubtreeAngle(child);
      return { child, leaves, minAngle };
    });

    const totalLeaves = childInfos.reduce((s, c) => s + c.leaves, 0);

    // Allocate angles: proportional to leaves, but respecting minimums
    // Two-pass allocation: first give minimums, then distribute remaining
    const allocated = childInfos.map((info) => {
      const proportional = (info.leaves / totalLeaves) * angleSpan;
      return { ...info, angle: Math.max(proportional, info.minAngle) };
    });

    // Normalize if total exceeds available span
    const totalAllocated = allocated.reduce((s, c) => s + c.angle, 0);
    if (totalAllocated > angleSpan) {
      const scale = angleSpan / totalAllocated;
      for (const a of allocated) a.angle *= scale;
    }

    // Position each child at the center of its allocated sector
    // CRITICAL: each child's subtree is strictly confined to its sector
    let currentAngle = startAngle;
    for (const info of allocated) {
      const childStart = currentAngle;
      const childEnd = currentAngle + info.angle;
      const midAngle = (childStart + childEnd) / 2;
      const r = radiusForDepth(info.child.depth);

      info.child.x = Math.cos(midAngle) * r - info.child.width / 2;
      info.child.y = Math.sin(midAngle) * r - info.child.height / 2;
      info.child.angle = midAngle;

      // Recurse with strictly bounded sector — prevents crossings
      positionChildren(info.child, childStart, childEnd);
      currentAngle = childEnd;
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

  function subtreeHeight(node: LayoutNode): number {
    if (node.children.length === 0) return node.height + vSpacing;
    let h = 0;
    for (const c of node.children) h += subtreeHeight(c);
    return Math.max(h, node.height + vSpacing);
  }

  // Balance left/right by subtree weight using a greedy partition.
  // Children stay in their original order within each side to prevent crossings.
  // We split at the index that best balances left/right total height.
  const n = root.children.length;
  const weights = root.children.map((c) => subtreeHeight(c));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  let bestSplit = Math.ceil(n / 2);
  let bestDiff = Infinity;
  let cumulative = 0;
  for (let i = 0; i < n; i++) {
    cumulative += weights[i];
    const rightW = cumulative;
    const leftW = totalWeight - cumulative;
    const diff = Math.abs(rightW - leftW);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestSplit = i + 1;
    }
  }

  // First bestSplit children go right (in order), rest go left (in order)
  const rightChildren = root.children.slice(0, bestSplit);
  const leftChildren = root.children.slice(bestSplit);

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
//
// Order-preserving: nodes at the same depth are sorted by their current
// position (y for horizontal layouts, angle for radial) and only pushed
// apart along that axis. The sibling order from the layout is never swapped,
// which guarantees edges from a parent to its children never cross.

function resolveCollisions(nodes: LayoutNode[], layout: string): void {
  const padding = 14;

  if (layout === 'radial') {
    // For radial, resolve overlaps by pushing nodes outward (increase radius)
    // while preserving their angular order. This avoids cross-subtree crossings.
    const byDepth = new Map<number, LayoutNode[]>();
    for (const n of nodes) {
      if (n.depth === 0) continue;
      const arr = byDepth.get(n.depth) || [];
      arr.push(n);
      byDepth.set(n.depth, arr);
    }

    for (const [, depthNodes] of byDepth) {
      // Sort by angle — this preserves the layout's angular order
      depthNodes.sort((a, b) => (a.angle ?? 0) - (b.angle ?? 0));

      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < depthNodes.length - 1; i++) {
          const a = depthNodes[i];
          const b = depthNodes[i + 1]; // only check adjacent nodes in angular order

          const overlapX = Math.min(a.x + a.width + padding, b.x + b.width + padding) - Math.max(a.x, b.x);
          const overlapY = Math.min(a.y + a.height + padding, b.y + b.height + padding) - Math.max(a.y, b.y);

          if (overlapX > 0 && overlapY > 0) {
            // Push apart along the tangential direction (perpendicular to radial)
            // This preserves the angular order and avoids crossings
            const aAngle = a.angle ?? 0;
            const bAngle = b.angle ?? 0;
            const midAngle = (aAngle + bAngle) / 2;
            // Tangent direction is perpendicular to radial
            const tangentX = -Math.sin(midAngle);
            const tangentY = Math.cos(midAngle);

            const push = Math.min(overlapX, overlapY) / 2 + padding / 2;

            // Push a in negative tangent, b in positive tangent
            a.x -= tangentX * push;
            a.y -= tangentY * push;
            shiftSubtree(a, 0, -tangentX * push, -tangentY * push);

            b.x += tangentX * push;
            b.y += tangentY * push;
            shiftSubtree(b, 0, tangentX * push, tangentY * push);
          }
        }
      }
    }
  } else if (layout === 'vertical') {
    // Vertical layout: sort by x position, push apart horizontally
    const byDepth = new Map<number, LayoutNode[]>();
    for (const n of nodes) {
      const arr = byDepth.get(n.depth) || [];
      arr.push(n);
      byDepth.set(n.depth, arr);
    }

    for (const [, depthNodes] of byDepth) {
      depthNodes.sort((a, b) => a.x - b.x);
      for (let i = 1; i < depthNodes.length; i++) {
        const prev = depthNodes[i - 1];
        const curr = depthNodes[i];
        const overlap = prev.x + prev.width + padding - curr.x;
        if (overlap > 0) {
          curr.x += overlap;
          shiftSubtreeXY(curr, overlap, 0);
        }
      }
    }
  } else {
    // Horizontal and tree layouts: sort by y position, push apart vertically
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
          shiftSubtreeXY(curr, 0, overlap);
        }
      }
    }
  }
}

function shiftSubtree(node: LayoutNode, _dy: number, dx: number, dy: number): void {
  for (const child of node.children) {
    child.x += dx;
    child.y += dy;
    shiftSubtree(child, 0, dx, dy);
  }
}

function shiftSubtreeXY(node: LayoutNode, dx: number, dy: number): void {
  for (const child of node.children) {
    child.x += dx;
    child.y += dy;
    shiftSubtreeXY(child, dx, dy);
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
  resolveCollisions(nodes, config.structure.layout);
  const edges = collectEdges(root);
  const bounds = computeBounds(nodes);

  const padding = config.export.padding;
  const width = bounds.maxX - bounds.minX + padding * 2;
  const height = bounds.maxY - bounds.minY + padding * 2;
  const offsetX = -bounds.minX + padding;
  const offsetY = -bounds.minY + padding;

  return { nodes, edges, width, height, offsetX, offsetY };
}
