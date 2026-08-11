"use client";

import { useState } from "react";
import {
  type ArchitectureDiagram,
  type ArchNode,
  NODE_STYLES,
} from "@/lib/architecture-diagrams";

const NODE_W = 120;
const NODE_H = 52;
const LAYER_GAP = 72;
const COL_GAP = 24;
const PAD = 32;

type ArchitectureDiagramViewProps = {
  diagram: ArchitectureDiagram;
  compact?: boolean;
  onNodeClick?: (node: ArchNode) => void;
};

export default function ArchitectureDiagramView({
  diagram,
  compact = false,
  onNodeClick,
}: ArchitectureDiagramViewProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const layers = new Map<number, ArchNode[]>();
  for (const node of diagram.nodes) {
    const list = layers.get(node.layer) ?? [];
    list.push(node);
    layers.set(node.layer, list);
  }

  const maxCols = Math.max(...diagram.nodes.map((n) => n.col + 1));
  const width = PAD * 2 + maxCols * NODE_W + (maxCols - 1) * COL_GAP;
  const height = PAD * 2 + layers.size * NODE_H + (layers.size - 1) * LAYER_GAP;

  const nodePositions = new Map<string, { x: number; y: number; cx: number; cy: number }>();

  for (const [layer, nodes] of layers) {
    const sorted = [...nodes].sort((a, b) => a.col - b.col);
    const layerWidth = sorted.length * NODE_W + (sorted.length - 1) * COL_GAP;
    const startX = (width - layerWidth) / 2;

    sorted.forEach((node, i) => {
      const x = startX + i * (NODE_W + COL_GAP);
      const y = PAD + layer * (NODE_H + LAYER_GAP);
      nodePositions.set(node.id, {
        x,
        y,
        cx: x + NODE_W / 2,
        cy: y + NODE_H / 2,
      });
    });
  }

  return (
    <div className={`rounded-lg border border-stone-200 bg-white overflow-hidden ${compact ? "" : "shadow-sm"}`}>
      <div className="px-3 py-2 border-b border-stone-100 bg-stone-50">
        <h4 className="text-xs font-medium text-stone-700">{diagram.title}</h4>
        {!compact && (
          <p className="text-[10px] text-stone-400 mt-0.5">{diagram.description}</p>
        )}
      </div>

      <div className="overflow-x-auto">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="mx-auto block"
          style={{ minWidth: compact ? width * 0.85 : width }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#a8a29e" />
            </marker>
            <marker
              id="arrowhead-dash"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#d6d3d1" />
            </marker>
          </defs>

          {/* Layer labels */}
          {Array.from(layers.keys()).map((layer) => {
            const labels = ["Clients", "Gateway / CDN", "Services", "Cache / Queue", "Storage"];
            return (
              <text
                key={`layer-${layer}`}
                x={8}
                y={PAD + layer * (NODE_H + LAYER_GAP) + NODE_H / 2 + 4}
                className="fill-stone-300"
                style={{ fontSize: 9 }}
              >
                {labels[layer] ?? ""}
              </text>
            );
          })}

          {/* Edges */}
          {diagram.edges.map((edge, i) => {
            const from = nodePositions.get(edge.from);
            const to = nodePositions.get(edge.to);
            if (!from || !to) return null;

            const dx = to.cx - from.cx;
            const dy = to.cy - from.cy;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            const x1 = from.cx + (dx / dist) * (NODE_H / 2);
            const y1 = from.cy + (dy / dist) * (NODE_H / 2);
            const x2 = to.cx - (dx / dist) * (NODE_H / 2 + 6);
            const y2 = to.cy - (dy / dist) * (NODE_H / 2 + 6);

            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            return (
              <g key={`edge-${i}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={edge.dashed ? "#d6d3d1" : "#a8a29e"}
                  strokeWidth={1.5}
                  strokeDasharray={edge.dashed ? "5,4" : undefined}
                  markerEnd={edge.dashed ? "url(#arrowhead-dash)" : "url(#arrowhead)"}
                />
                {edge.label && (
                  <text
                    x={midX}
                    y={midY - 6}
                    textAnchor="middle"
                    className="fill-stone-400"
                    style={{ fontSize: 9 }}
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {diagram.nodes.map((node) => {
            const pos = nodePositions.get(node.id);
            if (!pos) return null;
            const style = NODE_STYLES[node.type];
            const isHovered = hovered === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onNodeClick?.(node)}
                className={onNodeClick ? "cursor-pointer" : ""}
              >
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={8}
                  fill={style.fill}
                  stroke={isHovered ? style.stroke : style.stroke + "99"}
                  strokeWidth={isHovered ? 2 : 1.5}
                />
                <text
                  x={NODE_W / 2}
                  y={node.sublabel ? 20 : 24}
                  textAnchor="middle"
                  fill={style.text}
                  style={{ fontSize: 11, fontWeight: 600 }}
                >
                  {node.label}
                </text>
                {node.sublabel && (
                  <text
                    x={NODE_W / 2}
                    y={36}
                    textAnchor="middle"
                    fill="#a8a29e"
                    style={{ fontSize: 9 }}
                  >
                    {node.sublabel}
                  </text>
                )}
                <text x={10} y={16} style={{ fontSize: 10 }}>
                  {style.icon}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
