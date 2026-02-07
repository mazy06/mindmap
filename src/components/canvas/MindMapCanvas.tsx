import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { MindMapConfig, LayoutResult } from '../../types';
import SvgDefs from './SvgDefs';
import Edge from './Edge';
import MindMapNodeComponent from './Node';

interface MindMapCanvasProps {
  layout: LayoutResult;
  config: MindMapConfig;
  onToggleCollapse?: (id: string) => void;
  onSelectNode?: (id: string) => void;
  selectedNodeId?: string | null;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  onNodeDrag?: (nodeId: string, x: number, y: number) => void;
}

const MindMapCanvas: React.FC<MindMapCanvasProps> = ({
  layout,
  config,
  onToggleCollapse,
  onSelectNode,
  selectedNodeId,
  svgRef: externalRef,
  onNodeDrag,
}) => {
  const internalRef = useRef<SVGSVGElement>(null);
  const svgRef = externalRef || internalRef;
  const containerRef = useRef<HTMLDivElement>(null);

  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: layout.width, h: layout.height });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // ─── Drag state ────────────────────────────────────────────────────
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const isDraggingNode = dragNodeId !== null;

  // Reset viewBox when layout changes (but not from drag — drag changes nodePositions
  // which mutates layout.nodes in place before passing here)
  const prevDimsRef = useRef({ w: layout.width, h: layout.height });
  useEffect(() => {
    // Only reset viewBox on significant layout dimension changes (not from drag)
    const dw = Math.abs(layout.width - prevDimsRef.current.w);
    const dh = Math.abs(layout.height - prevDimsRef.current.h);
    if (dw > 50 || dh > 50) {
      setViewBox({ x: 0, y: 0, w: layout.width, h: layout.height });
      setZoom(1);
    }
    prevDimsRef.current = { w: layout.width, h: layout.height };
  }, [layout.width, layout.height]);

  // ─── Helpers: convert screen coords to SVG coords ─────────────────
  const screenToSvg = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const ratioX = viewBox.w / rect.width;
      const ratioY = viewBox.h / rect.height;
      return {
        x: viewBox.x + (clientX - rect.left) * ratioX,
        y: viewBox.y + (clientY - rect.top) * ratioY,
      };
    },
    [viewBox]
  );

  // ─── Node drag start (called from Node component) ─────────────────
  const handleNodeDragStart = useCallback(
    (nodeId: string, clientX: number, clientY: number) => {
      const svgPt = screenToSvg(clientX, clientY);
      // Find the node to compute offset from its current position
      const node = layout.nodes.find((n) => n.id === nodeId);
      if (!node) return;
      const nodeX = node.x + layout.offsetX;
      const nodeY = node.y + layout.offsetY;
      setDragNodeId(nodeId);
      setDragOffset({
        x: svgPt.x - nodeX,
        y: svgPt.y - nodeY,
      });
    },
    [screenToSvg, layout.nodes, layout.offsetX, layout.offsetY]
  );

  // ─── Pan handlers ──────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only pan if not dragging a node and left or middle button
      if (isDraggingNode) return;
      if (e.button === 0 || e.button === 1) {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    },
    [isDraggingNode]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // ─── Node dragging ─────────────────────────────────────────
      if (isDraggingNode && dragNodeId) {
        const svgPt = screenToSvg(e.clientX, e.clientY);
        // New position in layout coords (subtract offsetX/offsetY to get back to layout space)
        const newX = svgPt.x - dragOffset.x - layout.offsetX;
        const newY = svgPt.y - dragOffset.y - layout.offsetY;
        onNodeDrag?.(dragNodeId, newX, newY);
        return;
      }

      // ─── Canvas panning ────────────────────────────────────────
      if (!isPanning) return;
      const dx =
        (e.clientX - panStart.x) *
        (viewBox.w / (containerRef.current?.clientWidth || 800));
      const dy =
        (e.clientY - panStart.y) *
        (viewBox.h / (containerRef.current?.clientHeight || 600));
      setViewBox((prev) => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
    },
    [
      isDraggingNode,
      dragNodeId,
      dragOffset,
      screenToSvg,
      layout.offsetX,
      layout.offsetY,
      onNodeDrag,
      isPanning,
      panStart,
      viewBox.w,
      viewBox.h,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDragNodeId(null);
  }, []);

  // Zoom handler
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const scaleFactor = e.deltaY > 0 ? 1.1 : 0.9;
      const newZoom = Math.max(0.1, Math.min(5, zoom * scaleFactor));

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const svgX = viewBox.x + (mouseX / rect.width) * viewBox.w;
      const svgY = viewBox.y + (mouseY / rect.height) * viewBox.h;

      const newW = layout.width * (zoom * scaleFactor);
      const newH = layout.height * (zoom * scaleFactor);
      const newX = svgX - (mouseX / rect.width) * newW;
      const newY = svgY - (mouseY / rect.height) * newH;

      setViewBox({ x: newX, y: newY, w: newW, h: newH });
      setZoom(newZoom);
    },
    [zoom, viewBox, layout.width, layout.height]
  );

  // Fit to screen
  const handleFitToScreen = useCallback(() => {
    setViewBox({ x: 0, y: 0, w: layout.width, h: layout.height });
    setZoom(1);
  }, [layout.width, layout.height]);

  const bgColor = config.style.bgTransparent ? 'transparent' : config.style.bgColor;

  // Cursor logic
  let cursor = 'grab';
  if (isDraggingNode) cursor = 'grabbing';
  else if (isPanning) cursor = 'grabbing';

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        background: bgColor,
        borderRadius: '12px',
      }}
    >
      {/* Zoom controls */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          display: 'flex',
          gap: 6,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => {
            const s = 0.8;
            setViewBox((v) => ({
              x: v.x + (v.w * (1 - s)) / 2,
              y: v.y + (v.h * (1 - s)) / 2,
              w: v.w * s,
              h: v.h * s,
            }));
            setZoom((z) => z * 0.8);
          }}
          style={zoomBtnStyle}
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => {
            const s = 1.2;
            setViewBox((v) => ({
              x: v.x + (v.w * (1 - s)) / 2,
              y: v.y + (v.h * (1 - s)) / 2,
              w: v.w * s,
              h: v.h * s,
            }));
            setZoom((z) => z * 1.2);
          }}
          style={zoomBtnStyle}
          title="Zoom Out"
        >
          -
        </button>
        <button onClick={handleFitToScreen} style={zoomBtnStyle} title="Fit to Screen">
          &#x2293;
        </button>
      </div>

      <svg
        ref={svgRef as React.Ref<SVGSVGElement>}
        width="100%"
        height="100%"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        xmlns="http://www.w3.org/2000/svg"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          cursor,
          userSelect: 'none',
        }}
      >
        {/* Background */}
        <rect
          x={viewBox.x}
          y={viewBox.y}
          width={viewBox.w}
          height={viewBox.h}
          fill={bgColor}
        />

        <SvgDefs config={config} nodes={layout.nodes} />

        {/* Edges (rendered first, below nodes) */}
        <g className="edges">
          {layout.edges.map((edge) => (
            <Edge
              key={edge.id}
              edge={edge}
              config={config}
              offsetX={layout.offsetX}
              offsetY={layout.offsetY}
            />
          ))}
        </g>

        {/* Nodes */}
        <g className="nodes">
          {layout.nodes.map((layoutNode) => (
            <MindMapNodeComponent
              key={layoutNode.id}
              layoutNode={layoutNode}
              config={config}
              offsetX={layout.offsetX}
              offsetY={layout.offsetY}
              onToggleCollapse={onToggleCollapse}
              onSelectNode={onSelectNode}
              selectedNodeId={selectedNodeId}
              onDragStart={handleNodeDragStart}
              isDragging={dragNodeId === layoutNode.id}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

const zoomBtnStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 8,
  border: '1px solid rgba(0,0,0,0.12)',
  background: 'rgba(255,255,255,0.9)',
  backdropFilter: 'blur(8px)',
  cursor: 'pointer',
  fontSize: 18,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#334155',
  fontWeight: 600,
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

export default React.memo(MindMapCanvas);
