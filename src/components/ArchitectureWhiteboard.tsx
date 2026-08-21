"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  type NodeType,
  type ArchNode,
  type ArchEdge,
  NODE_STYLES,
} from "@/lib/architecture-diagrams";

const NODE_W = 120;
const NODE_H = 52;
const CANVAS_W = 1000;
const CANVAS_H = 600;

export type WhiteboardNode = {
  id: string;
  label: string;
  sublabel?: string;
  type: NodeType;
  x: number;
  y: number;
};

export type WhiteboardEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
};

type ArchitectureWhiteboardProps = {
  questionId: string;
  onStateChange?: (nodes: WhiteboardNode[], edges: WhiteboardEdge[]) => void;
};

export default function ArchitectureWhiteboard({
  questionId,
  onStateChange,
}: ArchitectureWhiteboardProps) {
  const [nodes, setNodes] = useState<WhiteboardNode[]>([]);
  const [edges, setEdges] = useState<WhiteboardEdge[]>([]);

  // Interaction State
  const [tool, setTool] = useState<"select" | "connect" | NodeType>("select");
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectionStartId, setConnectionStartId] = useState<string | null>(null);
  const [tempLineEnd, setTempLineEnd] = useState<{ x: number; y: number } | null>(null);

  // Selection & Editing State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);

  const [nodeForm, setNodeForm] = useState({ label: "", sublabel: "" });
  const [edgeForm, setEdgeForm] = useState({ label: "", dashed: false });

  const svgRef = useRef<SVGSVGElement>(null);

  // Load from localStorage on question change
  useEffect(() => {
    const saved = localStorage.getItem(`whiteboard_${questionId}`);
    if (saved) {
      try {
        const { nodes: n, edges: e } = JSON.parse(saved);
        setNodes(n || []);
        setEdges(e || []);
      } catch (err) {
        console.error("Failed to parse saved whiteboard state", err);
      }
    } else {
      // Start fresh or with a simple default Client node
      setNodes([
        { id: "client-1", label: "Client", sublabel: "Browser / App", type: "client", x: 80, y: 240 },
      ]);
      setEdges([]);
    }
    // Reset active tools/selections
    setTool("select");
    setConnectionStartId(null);
    setTempLineEnd(null);
    setDraggedNodeId(null);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setEditingNodeId(null);
    setEditingEdgeId(null);
  }, [questionId]);

  // Save to localStorage and notify parent
  useEffect(() => {
    if (nodes.length === 0) return; // avoid saving empty initial states
    const state = { nodes, edges };
    localStorage.setItem(`whiteboard_${questionId}`, JSON.stringify(state));
    onStateChange?.(nodes, edges);
  }, [nodes, edges, questionId, onStateChange]);

  // SVG Mouse Coordinate Helper
  const getCoordinates = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    // Calculate normalized point inside viewBox (CANVAS_W x CANVAS_H)
    const x = Math.round(((e.clientX - rect.left) / rect.width) * CANVAS_W);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * CANVAS_H);
    return { x, y };
  };

  // Canvas Interactions
  const handleCanvasPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    // Left click only
    if (e.button !== 0) return;

    const { x, y } = getCoordinates(e);

    // If currently a NodeType tool and clicked background, spawn element
    if (tool !== "select" && tool !== "connect") {
      const type = tool as NodeType;
      const id = `${type}-${Date.now()}`;
      const defaultLabels: Record<NodeType, { label: string; sublabel: string }> = {
        client: { label: "Client", sublabel: "Browser / Web App" },
        gateway: { label: "API Gateway", sublabel: "Reverse Proxy" },
        service: { label: "Core Service", sublabel: "Business Logic" },
        cache: { label: "Redis Cache", sublabel: "Key-Value Store" },
        queue: { label: "Message Queue", sublabel: "Kafka / RabbitMQ" },
        db: { label: "Database", sublabel: "MySQL / NoSQL" },
        cdn: { label: "CDN", sublabel: "Edge Static Cache" },
        storage: { label: "Object Storage", sublabel: "S3 / Assets" },
      };

      const newSelection = defaultLabels[type];
      const newNode: WhiteboardNode = {
        id,
        label: newSelection.label,
        sublabel: newSelection.sublabel,
        type,
        x: x - NODE_W / 2, // center the node under cursor
        y: y - NODE_H / 2,
      };

      setNodes((prev) => [...prev, newNode]);
      setSelectedNodeId(id);
      setSelectedEdgeId(null);
      setEditingNodeId(id);
      setNodeForm({ label: newNode.label, sublabel: newNode.sublabel || "" });
      setTool("select"); // switch back to pointer after placing
      e.stopPropagation();
      return;
    }

    // click background to deselect
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setEditingNodeId(null);
    setEditingEdgeId(null);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const { x, y } = getCoordinates(e);

    // If dragging a node
    if (draggedNodeId) {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === draggedNodeId
            ? {
              ...n,
              x: Math.max(0, Math.min(CANVAS_W - NODE_W, x - dragOffset.x)),
              y: Math.max(0, Math.min(CANVAS_H - NODE_H, y - dragOffset.y)),
            }
            : n
        )
      );
    }

    // If drawing temp connection line
    if (connectionStartId) {
      setTempLineEnd({ x, y });
    }
  };

  const handleCanvasPointerUp = () => {
    setDraggedNodeId(null);
    if (connectionStartId) {
      setConnectionStartId(null);
      setTempLineEnd(null);
    }
  };

  // Node Interactions
  const handleNodePointerDown = (e: React.PointerEvent, node: WhiteboardNode) => {
    e.stopPropagation();
    if (e.button !== 0) return;

    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);

    // Set connection start if connect tool active
    if (tool === "connect") {
      setConnectionStartId(node.id);
      const cx = node.x + NODE_W / 2;
      const cy = node.y + NODE_H / 2;
      setTempLineEnd({ x: cx, y: cy });
      return;
    }

    // Else trigger dragging
    setDraggedNodeId(node.id);
    const rect = (e.currentTarget as Element).getBoundingClientRect();
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (svgRect) {
      // drag offset relative to top-left of node in viewBox scale
      const coordX = Math.round(((e.clientX - svgRect.left) / svgRect.width) * CANVAS_W);
      const coordY = Math.round(((e.clientY - svgRect.top) / svgRect.height) * CANVAS_H);
      setDragOffset({
        x: coordX - node.x,
        y: coordY - node.y,
      });
    }
  };

  const handleNodePointerUp = (e: React.PointerEvent, node: WhiteboardNode) => {
    e.stopPropagation();

    // If connection draw is active and we release on A DIFFERENT node
    if (connectionStartId && connectionStartId !== node.id) {
      // Prevent duplicate edges
      const exists = edges.some(
        (edge) => edge.from === connectionStartId && edge.to === node.id
      );
      if (!exists) {
        const newEdge: WhiteboardEdge = {
          id: `edge-${Date.now()}`,
          from: connectionStartId,
          to: node.id,
          label: "",
          dashed: false,
        };
        setEdges((prev) => [...prev, newEdge]);
        setSelectedEdgeId(newEdge.id);
        setEditingEdgeId(newEdge.id);
        setEdgeForm({ label: "", dashed: false });
      }
    }

    setConnectionStartId(null);
    setTempLineEnd(null);
    setDraggedNodeId(null);
  };

  const handleNodeDoubleClick = (e: React.MouseEvent, node: WhiteboardNode) => {
    e.stopPropagation();
    setEditingNodeId(node.id);
    setNodeForm({ label: node.label, sublabel: node.sublabel || "" });
  };

  // Node editing form submission
  const handleSaveNode = () => {
    if (!editingNodeId) return;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === editingNodeId
          ? { ...n, label: nodeForm.label || "Component", sublabel: nodeForm.sublabel || undefined }
          : n
      )
    );
    setEditingNodeId(null);
  };

  // Edge Interactions
  const handleEdgeClick = (e: React.MouseEvent, edge: WhiteboardEdge) => {
    e.stopPropagation();
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
    setEditingEdgeId(edge.id);
    setEdgeForm({ label: edge.label || "", dashed: !!edge.dashed });
  };

  // Edge editing form submission
  const handleSaveEdge = () => {
    if (!editingEdgeId) return;
    setEdges((prev) =>
      prev.map((e) =>
        e.id === editingEdgeId
          ? { ...e, label: edgeForm.label, dashed: edgeForm.dashed }
          : e
      )
    );
    setEditingEdgeId(null);
  };

  // Delete Selection
  const handleDeleteSelected = () => {
    if (selectedNodeId) {
      setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
      setEdges((prev) => prev.filter((e) => e.from !== selectedNodeId && e.to !== selectedNodeId));
      setSelectedNodeId(null);
      setEditingNodeId(null);
    } else if (selectedEdgeId) {
      setEdges((prev) => prev.filter((e) => e.id !== selectedEdgeId));
      setSelectedEdgeId(null);
      setEditingEdgeId(null);
    }
  };

  const handleClearCanvas = () => {
    if (confirm("Are you sure you want to clear your current design canvas?")) {
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setEditingNodeId(null);
      setEditingEdgeId(null);
    }
  };

  // Grid coordinates math helpers for arrows
  const getNodeCenter = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { cx: 0, cy: 0 };
    return {
      cx: node.x + NODE_W / 2,
      cy: node.y + NODE_H / 2,
    };
  };

  // Calculate box-boundary intersections for clean arrows
  const getEdgeCoords = (fromId: string, toId: string) => {
    const fromNode = nodes.find((n) => n.id === fromId);
    const toNode = nodes.find((n) => n.id === toId);
    if (!fromNode || !toNode) return { x1: 0, y1: 0, x2: 0, y2: 0 };

    const fromCx = fromNode.x + NODE_W / 2;
    const fromCy = fromNode.y + NODE_H / 2;
    const toCx = toNode.x + NODE_W / 2;
    const toCy = toNode.y + NODE_H / 2;

    const dx = toCx - fromCx;
    const dy = toCy - fromCy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // Approximate rectangle border intersection using angle
    const angle = Math.abs(Math.atan2(dy, dx));
    // Since NODE_W/2 = 60 and NODE_H/2 = 26, calculate intercept
    const borderDistFrom = Math.min(
      60 / Math.max(0.01, Math.cos(angle)),
      26 / Math.max(0.01, Math.sin(angle))
    );
    const borderDistTo = Math.min(
      60 / Math.max(0.01, Math.cos(angle)),
      26 / Math.max(0.01, Math.sin(angle))
    );

    return {
      x1: fromCx + (dx / dist) * borderDistFrom,
      y1: fromCy + (dy / dist) * borderDistFrom,
      x2: toCx - (dx / dist) * (borderDistTo + 8), // offset slightly for arrowhead markers
      y2: toCy - (dy / dist) * (borderDistTo + 8),
    };
  };

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* WHITEBOARD TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 border-b border-stone-200 bg-stone-50 text-xs">
        {/* Tools Group */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => { setTool("select"); setConnectionStartId(null); }}
            className={`px-3 py-1.5 rounded border transition-all flex items-center gap-1 ${tool === "select"
              ? "bg-stone-900 border-stone-900 text-white font-medium shadow-sm"
              : "bg-white border-stone-200 text-stone-600 hover:border-stone-400"
              }`}
            title="Move & Select Elements"
          >
            <span>🖱️</span> Pointer
          </button>
          <button
            onClick={() => { setTool("connect"); setSelectedNodeId(null); }}
            className={`px-3 py-1.5 rounded border transition-all flex items-center gap-1 ${tool === "connect"
              ? "bg-amber-800 border-amber-800 text-white font-medium shadow-sm animate-pulse"
              : "bg-white border-stone-200 text-stone-600 hover:border-stone-400"
              }`}
            title="Click Node A, hold/drag, & release on Node B to connect"
          >
            <span>➡️</span> Connection Link
          </button>

          <div className="h-4 w-px bg-stone-300 mx-1" />

          {/* Node Palettes */}
          <div className="flex items-center gap-1 flex-wrap">
            {(Object.keys(NODE_STYLES) as NodeType[]).map((type) => {
              const style = NODE_STYLES[type];
              const isSelected = tool === type;
              return (
                <button
                  key={type}
                  onClick={() => { setTool(type); setConnectionStartId(null); }}
                  className={`px-2 py-1 rounded border capitalize flex items-center gap-1 transition-all ${isSelected
                    ? "border-stone-900 ring-2 ring-stone-900 font-semibold"
                    : "bg-white border-stone-200 text-stone-600 hover:border-stone-400"
                    }`}
                  style={isSelected ? { backgroundColor: style.fill, color: style.text } : {}}
                  title={`Click to select, then click on canvas to spawn a ${type}`}
                >
                  <span className="text-[10px]">{style.icon}</span>
                  <span className="text-[10px]">{type}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions Group */}
        <div className="flex items-center gap-1.5">
          {(selectedNodeId || selectedEdgeId) && (
            <button
              onClick={handleDeleteSelected}
              className="px-2.5 py-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300 rounded font-medium transition-colors"
            >
              🗑️ Delete Selected
            </button>
          )}
          <button
            onClick={handleClearCanvas}
            className="px-2.5 py-1.5 border border-stone-200 hover:border-stone-450 hover:bg-stone-100 text-stone-500 rounded transition-colors"
          >
            Clear Canvas
          </button>
        </div>
      </div>

      {/* CANVAS CONTAINER */}
      <div className="relative flex-1 overflow-auto bg-stone-50 border border-stone-200 cursor-crosshair min-h-[350px]">
        {/* Helper Instructions bar overlay */}
        <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-stone-950/85 backdrop-blur border border-stone-300 rounded-md text-[9px] text-stone-705 pointer-events-none font-mono">
          {tool === "select" && "🖱️ Drag nodes to move. Double-click node to rename. Click lines to edit."}
          {tool === "connect" && "➡️ Press pointer on a node, drag and drop on another node to connect."}
          {tool !== "select" && tool !== "connect" && `📍 Click on the canvas to place a new ${tool}.`}
        </div>

        <svg
          ref={svgRef}
          width={CANVAS_W}
          height={CANVAS_H}
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          className="mx-auto block bg-stone-50 select-none touch-none"
          style={{ width: "100%", height: "auto", minWidth: CANVAS_W }}
        >
          {/* SVG GRID BACKGROUND */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="rgba(0, 255, 102, 0.15)" />
            </pattern>
            <marker
              id="arrowhead-whiteboard"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#10b981" />
            </marker>
            <marker
              id="arrowhead-whiteboard-dashed"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="rgba(16, 185, 129, 0.7)" />
            </marker>
            <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="1" dy="1.5" stdDeviation="1.5" floodColor="#00ff66" floodOpacity="0.08" />
            </filter>
          </defs>


          {/* Grid Layer */}
          <rect width={CANVAS_W} height={CANVAS_H} fill="url(#grid)" />

          {/* Edges/Connections Layer */}
          {edges.map((edge) => {
            const coords = getEdgeCoords(edge.from, edge.to);
            const isSelected = selectedEdgeId === edge.id;

            const midX = (coords.x1 + coords.x2) / 2;
            const midY = (coords.y1 + coords.y2) / 2;

            return (
              <g
                key={edge.id}
                onClick={(e) => handleEdgeClick(e, edge)}
                className="cursor-pointer group"
              >
                {/* Fat transparent helper line for easier clicking */}
                <line
                  x1={coords.x1}
                  y1={coords.y1}
                  x2={coords.x2}
                  y2={coords.y2}
                  stroke="transparent"
                  strokeWidth={12}
                />
                {/* Visual Arrow Line */}
                <line
                  x1={coords.x1}
                  y1={coords.y1}
                  x2={coords.x2}
                  y2={coords.y2}
                  stroke={isSelected ? "#1c1917" : edge.dashed ? "#a8a29e" : "#78716c"}
                  strokeWidth={isSelected ? 2.5 : 1.75}
                  strokeDasharray={edge.dashed ? "6,5" : undefined}
                  markerEnd={
                    edge.dashed
                      ? "url(#arrowhead-whiteboard-dashed)"
                      : "url(#arrowhead-whiteboard)"
                  }
                  className="transition-colors group-hover:stroke-stone-900"
                />

                {/* Edge Label Banner */}
                {edge.label ? (
                  <g>
                    <rect
                      x={midX - (edge.label.length * 3.2 + 6)}
                      y={midY - 9}
                      width={edge.label.length * 6.4 + 12}
                      height={16}
                      rx={4}
                      fill="#fafaf9"
                      stroke={isSelected ? "#78716c" : "#e7e5e4"}
                      strokeWidth={1}
                    />
                    <text
                      x={midX}
                      y={midY + 2}
                      textAnchor="middle"
                      fill={isSelected ? "#1c1917" : "#57534e"}
                      style={{ fontSize: 9, fontWeight: 500 }}
                    >
                      {edge.label}
                    </text>
                  </g>
                ) : (
                  /* Draw a little dot when hovered or selected, to indicate clickability */
                  (isSelected || tool === "select") && (
                    <circle
                      cx={midX}
                      cy={midY}
                      r={4}
                      fill={isSelected ? "#1ea675" : "#a8a29e"}
                      opacity={isSelected ? 1 : 0.2}
                      className="group-hover:opacity-100 transition-opacity"
                    />
                  )
                )}
              </g>
            );
          })}

          {/* Temp Drawing Line */}
          {connectionStartId && tempLineEnd && (() => {
            const startCenter = getNodeCenter(connectionStartId);
            return (
              <line
                x1={startCenter.cx}
                y1={startCenter.cy}
                x2={tempLineEnd.x}
                y2={tempLineEnd.y}
                stroke="#1ea675"
                strokeWidth={2}
                strokeDasharray="4,4"
                markerEnd="url(#arrowhead-whiteboard)"
              />
            );
          })()}

          {/* Nodes Layer */}
          {nodes.map((node) => {
            const style = NODE_STYLES[node.type];
            const isSelected = selectedNodeId === node.id;
            const isEditing = editingNodeId === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onPointerDown={(e) => handleNodePointerDown(e, node)}
                onPointerUp={(e) => handleNodePointerUp(e, node)}
                onDoubleClick={(e) => handleNodeDoubleClick(e, node)}
                className="cursor-move group select-none"
              >
                {/* Node Box */}
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={8}
                  fill={style.fill}
                  stroke={
                    isSelected
                      ? "#1c1917"
                      : connectionStartId === node.id
                        ? "#1ea675"
                        : style.stroke + "cc"
                  }
                  strokeWidth={isSelected || connectionStartId === node.id ? 2.5 : 1.5}
                  filter="url(#shadow)"
                  className="transition-shadow group-hover:stroke-stone-900"
                />

                {/* Node Label Text */}
                <text
                  x={NODE_W / 2}
                  y={node.sublabel ? 20 : 28}
                  textAnchor="middle"
                  fill={style.text}
                  style={{
                    fontSize: 11,
                    fontWeight: 650,
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                >
                  {node.label}
                </text>

                {/* Sublabel Text if available */}
                {node.sublabel && (
                  <text
                    x={NODE_W / 2}
                    y={36}
                    textAnchor="middle"
                    fill="#78716c"
                    style={{
                      fontSize: 8.5,
                      fontWeight: 400,
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  >
                    {node.sublabel}
                  </text>
                )}

                {/* Top-left component Emoji indicator */}
                <text
                  x={8}
                  y={17}
                  style={{
                    fontSize: 9.5,
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                >
                  {style.icon}
                </text>

                {/* Connection Indicator rings when dragging a connection */}
                {tool === "connect" && connectionStartId && connectionStartId !== node.id && (
                  <rect
                    width={NODE_W + 6}
                    height={NODE_H + 6}
                    x={-3}
                    y={-3}
                    rx={10}
                    fill="transparent"
                    stroke="#1ea675"
                    strokeWidth={1.5}
                    strokeDasharray="3,3"
                    className="animate-pulse"
                  />
                )}

                {/* Node focus outline */}
                {isSelected && (
                  <rect
                    width={NODE_W + 8}
                    height={NODE_H + 8}
                    x={-4}
                    y={-4}
                    rx={11}
                    fill="transparent"
                    stroke="#1c1917"
                    strokeWidth={1}
                    strokeDasharray="2,2"
                    opacity={0.4}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* FLOAT PANELS FOR ELEMENT EDITING */}
      {editingNodeId && (() => {
        const node = nodes.find((n) => n.id === editingNodeId);
        if (!node) return null;
        return (
          <div className="p-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-xl">{NODE_STYLES[node.type]?.icon}</span>
              <div>
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                  Editing Node Model ({node.type})
                </h4>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    placeholder="Component Label"
                    value={nodeForm.label}
                    onChange={(e) => setNodeForm((prev) => ({ ...prev, label: e.target.value }))}
                    className="px-2 py-1 border border-stone-200 bg-white rounded text-xs w-40 focus:outline-none focus:border-stone-900"
                    onKeyDown={(e) => e.key === "Enter" && handleSaveNode()}
                  />
                  <input
                    type="text"
                    placeholder="Description / Subtext"
                    value={nodeForm.sublabel}
                    onChange={(e) => setNodeForm((prev) => ({ ...prev, sublabel: e.target.value }))}
                    className="px-2 py-1 border border-stone-200 bg-white rounded text-xs w-56 focus:outline-none focus:border-stone-900"
                    onKeyDown={(e) => e.key === "Enter" && handleSaveNode()}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setEditingNodeId(null)}
                className="px-3 py-1 border border-stone-200 rounded text-xs text-stone-500 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNode}
                className="px-3 py-1 bg-stone-900 text-white rounded text-xs hover:bg-stone-800 font-semibold"
              >
                Apply Changes
              </button>
            </div>
          </div>
        );
      })()}

      {editingEdgeId && (() => {
        const edge = edges.find((e) => e.id === editingEdgeId);
        if (!edge) return null;
        const fromNode = nodes.find((n) => n.id === edge.from);
        const toNode = nodes.find((n) => n.id === edge.to);
        return (
          <div className="p-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-xl">➡️</span>
              <div>
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                  Editing Connection ({fromNode?.label || "Node"} ➜ {toNode?.label || "Node"})
                </h4>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="text"
                    placeholder="Connection Label (e.g. JSON/HTTPS)"
                    value={edgeForm.label}
                    onChange={(e) => setEdgeForm((prev) => ({ ...prev, label: e.target.value }))}
                    className="px-2 py-1 border border-stone-200 bg-white rounded text-xs w-64 focus:outline-none focus:border-stone-900"
                    onKeyDown={(e) => e.key === "Enter" && handleSaveEdge()}
                  />
                  <label className="flex items-center gap-1.5 text-xs text-stone-605 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={edgeForm.dashed}
                      onChange={(e) => setEdgeForm((prev) => ({ ...prev, dashed: e.target.checked }))}
                      className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                    />
                    <span>Dashed Line (Async/Secondary)</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setEditingEdgeId(null)}
                className="px-3 py-1 border border-stone-200 rounded text-xs text-stone-500 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdge}
                className="px-3 py-1 bg-stone-900 text-white rounded text-xs hover:bg-stone-800 font-semibold"
              >
                Apply Changes
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// Global utility helper to serialize whiteboard state into a user-friendly text diagram representation
export function serializeWhiteboardToText(nodes: WhiteboardNode[], edges: WhiteboardEdge[]): string {
  if (nodes.length === 0) return "No architecture diagram sketched.";

  let result = "Whiteboard Architecture Sketch:\n";
  result += "=== Components ===\n";
  nodes.forEach((n) => {
    result += `- [${n.id}] ${n.label} (${n.type})${n.sublabel ? `: ${n.sublabel}` : ""}\n`;
  });

  result += "\n=== Connections ===\n";
  if (edges.length === 0) {
    result += "No connections drawn.\n";
  } else {
    edges.forEach((e) => {
      const fromNode = nodes.find((n) => n.id === e.from);
      const toNode = nodes.find((n) => n.id === e.to);
      if (fromNode && toNode) {
        const style = e.dashed ? "(dashed line / async)" : "(solid line / sync)";
        const label = e.label ? ` via "${e.label}"` : "";
        result += `- ${fromNode.label} ➜ ${toNode.label} ${style}${label}\n`;
      }
    });
  }
  return result;
}
