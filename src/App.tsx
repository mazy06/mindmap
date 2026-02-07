import React, { useState, useCallback, useMemo, useRef } from 'react';
import type { MindMapNode, MindMapConfig, ThemePreset, LayoutResult } from './types';
import { defaultConfig, applyTheme } from './themes';
import { computeLayout } from './engine/layoutEngine';
import { sampleMindMap } from './data/sampleData';
import MindMapCanvas from './components/canvas/MindMapCanvas';
import ControlsPanel from './components/controls/ControlsPanel';
import DataInput from './components/input/DataInput';
import './App.css';

// Manual position overrides from drag & drop
export type NodePositions = Record<string, { x: number; y: number }>;

const App: React.FC = () => {
  const [data, setData] = useState<MindMapNode>(sampleMindMap);
  const [config, setConfig] = useState<MindMapConfig>(defaultConfig);
  const [activeTheme, setActiveTheme] = useState<ThemePreset>('light');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [nodePositions, setNodePositions] = useState<NodePositions>({});

  const svgRef = useRef<SVGSVGElement>(null);

  // Compute layout from data + config, then apply manual drag overrides
  const layout = useMemo((): LayoutResult => {
    const base = computeLayout(data, config);

    // Apply manual position overrides
    const hasOverrides = Object.keys(nodePositions).length > 0;
    if (!hasOverrides) return base;

    for (const node of base.nodes) {
      const override = nodePositions[node.id];
      if (override) {
        node.x = override.x;
        node.y = override.y;
      }
    }

    return base;
  }, [data, config, nodePositions]);

  // Build a map from nodeId to all descendant ids (used for drag propagation)
  const descendantsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    function collectDescendants(nodes: typeof layout.nodes, nodeId: string): string[] {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return [];
      const ids: string[] = [];
      for (const child of node.children) {
        ids.push(child.id);
        ids.push(...collectDescendants(nodes, child.id));
      }
      return ids;
    }
    for (const node of layout.nodes) {
      map.set(node.id, collectDescendants(layout.nodes, node.id));
    }
    return map;
  }, [layout.nodes]);

  // Theme change
  const handleThemeChange = useCallback(
    (theme: ThemePreset) => {
      setActiveTheme(theme);
      setConfig((prev) => applyTheme(prev, theme));
    },
    []
  );

  // Toggle collapse
  const handleToggleCollapse = useCallback(
    (nodeId: string) => {
      setData((prev) => toggleCollapse(prev, nodeId));
    },
    []
  );

  // Handle node drag — move dragged node + all descendants by the same delta
  const handleNodeDrag = useCallback(
    (nodeId: string, x: number, y: number) => {
      setNodePositions((prev) => {
        const next = { ...prev };

        // Find the node's current position (from override or from layout)
        const layoutNode = layout.nodes.find((n) => n.id === nodeId);
        if (!layoutNode) return prev;

        const currentX = prev[nodeId]?.x ?? layoutNode.x;
        const currentY = prev[nodeId]?.y ?? layoutNode.y;
        const deltaX = x - currentX;
        const deltaY = y - currentY;

        // Move the dragged node
        next[nodeId] = { x, y };

        // Move all descendants by the same delta
        const descendants = descendantsMap.get(nodeId) || [];
        for (const childId of descendants) {
          const childLayout = layout.nodes.find((n) => n.id === childId);
          if (!childLayout) continue;
          const childCurrentX = prev[childId]?.x ?? childLayout.x;
          const childCurrentY = prev[childId]?.y ?? childLayout.y;
          next[childId] = {
            x: childCurrentX + deltaX,
            y: childCurrentY + deltaY,
          };
        }

        return next;
      });
    },
    [layout.nodes, descendantsMap]
  );

  // Reset positions when layout type or data structure changes
  const handleConfigChange = useCallback(
    (newConfig: MindMapConfig) => {
      if (newConfig.structure.layout !== config.structure.layout) {
        setNodePositions({});
      }
      setConfig(newConfig);
    },
    [config.structure.layout]
  );

  const handleDataChange = useCallback(
    (newData: MindMapNode) => {
      setData(newData);
      setNodePositions({});
    },
    []
  );

  // Node count
  const nodeCount = useMemo(() => countNodes(data), [data]);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <button
            className="panel-toggle"
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            title="Toggle Data Panel"
          >
            {leftPanelOpen ? '\u25C0' : '\u25B6'}
          </button>
          <div className="header-brand">
            <h1 className="header-title">MindMap Studio</h1>
            <span className="header-subtitle">{nodeCount} nodes</span>
          </div>
        </div>
        <div className="header-right">
          {Object.keys(nodePositions).length > 0 && (
            <button
              className="reset-positions-btn"
              onClick={() => setNodePositions({})}
              title="Reset all manual positions"
            >
              Reset Positions
            </button>
          )}
          <span className="header-badge">{config.structure.layout}</span>
          <span className="header-badge theme-badge">{activeTheme}</span>
          <button
            className="panel-toggle"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            title="Toggle Settings Panel"
          >
            {rightPanelOpen ? '\u25B6' : '\u25C0'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="app-body">
        {/* Left panel: Data Input */}
        {leftPanelOpen && (
          <DataInput
            data={data}
            onDataChange={handleDataChange}
            selectedNodeId={selectedNodeId}
          />
        )}

        {/* Center: Canvas */}
        <div className="canvas-area">
          <MindMapCanvas
            layout={layout}
            config={config}
            onToggleCollapse={handleToggleCollapse}
            onSelectNode={setSelectedNodeId}
            selectedNodeId={selectedNodeId}
            svgRef={svgRef}
            onNodeDrag={handleNodeDrag}
          />
        </div>

        {/* Right panel: Controls */}
        {rightPanelOpen && (
          <ControlsPanel
            config={config}
            onConfigChange={handleConfigChange}
            onThemeChange={handleThemeChange}
            svgRef={svgRef}
            activeTheme={activeTheme}
          />
        )}
      </div>
    </div>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toggleCollapse(node: MindMapNode, targetId: string): MindMapNode {
  if (node.id === targetId) {
    return { ...node, collapsed: !node.collapsed };
  }
  return {
    ...node,
    children: node.children.map((c) => toggleCollapse(c, targetId)),
  };
}

function countNodes(node: MindMapNode): number {
  return 1 + node.children.reduce((sum, c) => sum + countNodes(c), 0);
}

export default App;
