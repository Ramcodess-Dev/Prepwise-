export type NodeType =
  | "client"
  | "gateway"
  | "service"
  | "cache"
  | "queue"
  | "db"
  | "cdn"
  | "storage";

export type ArchNode = {
  id: string;
  label: string;
  sublabel?: string;
  type: NodeType;
  layer: number;
  col: number;
};

export type ArchEdge = {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
};

export type ArchitectureDiagram = {
  id: string;
  title: string;
  description: string;
  nodes: ArchNode[];
  edges: ArchEdge[];
};

export const NODE_STYLES: Record<
  NodeType,
  { fill: string; stroke: string; text: string; icon: string }
> = {
  client: { fill: "#081320", stroke: "#2563eb", text: "#60a5fa", icon: "👤" },
  gateway: { fill: "#081e18", stroke: "#10b981", text: "#34d399", icon: "⚡" },
  service: { fill: "#130b20", stroke: "#8b5cf6", text: "#c084fc", icon: "⚙️" },
  cache: { fill: "#1c1007", stroke: "#ea580c", text: "#ffedd5", icon: "⚡" },
  queue: { fill: "#1a1605", stroke: "#ca8a04", text: "#fef9c3", icon: "📨" },
  db: { fill: "#051e16", stroke: "#10b981", text: "#00ff66", icon: "🗄️" },
  cdn: { fill: "#041b1d", stroke: "#0891b2", text: "#22d3ee", icon: "🌐" },
  storage: { fill: "#081c0e", stroke: "#16a34a", text: "#86efac", icon: "📦" },
};


export const ARCHITECTURE_DIAGRAMS: Record<string, ArchitectureDiagram[]> = {
  "Design a URL shortener": [
    {
      id: "url-overview",
      title: "URL Shortener — High Level",
      description: "Client → API → encode service → cache/DB → redirect on read",
      nodes: [
        { id: "client", label: "Client", sublabel: "Browser / App", type: "client", layer: 0, col: 1 },
        { id: "cdn", label: "CDN", sublabel: "Edge cache", type: "cdn", layer: 1, col: 0 },
        { id: "lb", label: "Load Balancer", type: "gateway", layer: 1, col: 1 },
        { id: "api", label: "API Server", sublabel: "REST endpoints", type: "service", layer: 2, col: 0 },
        { id: "encode", label: "Encode Service", sublabel: "base62 / hash", type: "service", layer: 2, col: 1 },
        { id: "analytics", label: "Analytics", sublabel: "Click tracking", type: "service", layer: 2, col: 2 },
        { id: "redis", label: "Redis Cache", sublabel: "Hot URLs", type: "cache", layer: 3, col: 0 },
        { id: "db", label: "PostgreSQL", sublabel: "short → long map", type: "db", layer: 3, col: 1 },
        { id: "analytics-db", label: "Analytics DB", sublabel: "Click events", type: "db", layer: 3, col: 2 },
      ],
      edges: [
        { from: "client", to: "cdn", label: "GET /abc123" },
        { from: "cdn", to: "lb" },
        { from: "client", to: "lb", label: "POST /shorten", dashed: true },
        { from: "lb", to: "api" },
        { from: "api", to: "encode" },
        { from: "api", to: "analytics" },
        { from: "encode", to: "redis" },
        { from: "encode", to: "db" },
        { from: "analytics", to: "analytics-db" },
        { from: "redis", to: "db", label: "cache miss", dashed: true },
      ],
    },
    {
      id: "url-read-path",
      title: "Read Path — Redirect Flow",
      description: "How a short URL redirect works at scale",
      nodes: [
        { id: "user", label: "User", type: "client", layer: 0, col: 1 },
        { id: "cdn", label: "CDN", sublabel: "301 cached", type: "cdn", layer: 1, col: 0 },
        { id: "lb", label: "Load Balancer", type: "gateway", layer: 1, col: 1 },
        { id: "redirect", label: "Redirect Service", type: "service", layer: 2, col: 1 },
        { id: "redis", label: "Redis", sublabel: "< 1ms lookup", type: "cache", layer: 3, col: 0 },
        { id: "db", label: "Database", sublabel: "fallback", type: "db", layer: 3, col: 2 },
      ],
      edges: [
        { from: "user", to: "cdn", label: "GET /x7Kp" },
        { from: "cdn", to: "user", label: "301 redirect", dashed: true },
        { from: "cdn", to: "lb", label: "cache miss" },
        { from: "lb", to: "redirect" },
        { from: "redirect", to: "redis" },
        { from: "redis", to: "redirect", label: "hit", dashed: true },
        { from: "redirect", to: "db", label: "miss" },
        { from: "redirect", to: "user", label: "301 → long URL" },
      ],
    },
  ],
  "Design a chat system": [
    {
      id: "chat-overview",
      title: "Chat System — High Level",
      description: "Real-time messaging with WebSockets, queues, and offline push",
      nodes: [
        { id: "client-a", label: "User A", type: "client", layer: 0, col: 0 },
        { id: "client-b", label: "User B", type: "client", layer: 0, col: 2 },
        { id: "ws-gw", label: "WebSocket Gateway", sublabel: "Connection mgmt", type: "gateway", layer: 1, col: 1 },
        { id: "chat-svc", label: "Chat Service", sublabel: "Send / receive", type: "service", layer: 2, col: 0 },
        { id: "presence", label: "Presence Service", sublabel: "Online status", type: "service", layer: 2, col: 1 },
        { id: "push", label: "Push Service", sublabel: "FCM / APNs", type: "service", layer: 2, col: 2 },
        { id: "kafka", label: "Kafka", sublabel: "Message queue", type: "queue", layer: 3, col: 0 },
        { id: "redis", label: "Redis", sublabel: "Sessions / presence", type: "cache", layer: 3, col: 1 },
        { id: "msg-db", label: "Message DB", sublabel: "Cassandra / Mongo", type: "db", layer: 4, col: 0 },
        { id: "user-db", label: "User DB", sublabel: "Profiles", type: "db", layer: 4, col: 2 },
      ],
      edges: [
        { from: "client-a", to: "ws-gw", label: "WebSocket" },
        { from: "client-b", to: "ws-gw", label: "WebSocket" },
        { from: "ws-gw", to: "chat-svc" },
        { from: "ws-gw", to: "presence" },
        { from: "chat-svc", to: "kafka" },
        { from: "kafka", to: "chat-svc" },
        { from: "chat-svc", to: "msg-db" },
        { from: "chat-svc", to: "push", label: "offline" },
        { from: "push", to: "client-b", label: "push notif", dashed: true },
        { from: "presence", to: "redis" },
        { from: "chat-svc", to: "user-db" },
      ],
    },
    {
      id: "chat-group",
      title: "Group Chat — Message Flow",
      description: "Fan-out delivery to group members",
      nodes: [
        { id: "sender", label: "Sender", type: "client", layer: 0, col: 1 },
        { id: "chat-svc", label: "Chat Service", type: "service", layer: 1, col: 1 },
        { id: "kafka", label: "Kafka Topic", sublabel: "per-group partition", type: "queue", layer: 2, col: 1 },
        { id: "worker", label: "Delivery Workers", sublabel: "Fan-out", type: "service", layer: 3, col: 1 },
        { id: "m1", label: "Member 1", type: "client", layer: 4, col: 0 },
        { id: "m2", label: "Member 2", type: "client", layer: 4, col: 1 },
        { id: "m3", label: "Member N", type: "client", layer: 4, col: 2 },
      ],
      edges: [
        { from: "sender", to: "chat-svc", label: "send msg" },
        { from: "chat-svc", to: "kafka" },
        { from: "kafka", to: "worker" },
        { from: "worker", to: "m1" },
        { from: "worker", to: "m2" },
        { from: "worker", to: "m3" },
      ],
    },
  ],
  "Design a news feed": [
    {
      id: "feed-overview",
      title: "News Feed — High Level",
      description: "Hybrid push/pull fanout with timeline cache",
      nodes: [
        { id: "user", label: "User", type: "client", layer: 0, col: 1 },
        { id: "lb", label: "Load Balancer", type: "gateway", layer: 1, col: 1 },
        { id: "feed-api", label: "Feed API", type: "service", layer: 2, col: 0 },
        { id: "post-svc", label: "Post Service", sublabel: "Create posts", type: "service", layer: 2, col: 1 },
        { id: "fanout", label: "Fanout Service", sublabel: "Push to timelines", type: "service", layer: 2, col: 2 },
        { id: "ranking", label: "Ranking Engine", sublabel: "ML / scoring", type: "service", layer: 2, col: 3 },
        { id: "timeline-cache", label: "Timeline Cache", sublabel: "Redis sorted sets", type: "cache", layer: 3, col: 0 },
        { id: "post-db", label: "Post DB", sublabel: "Sharded", type: "db", layer: 3, col: 1 },
        { id: "graph-db", label: "Social Graph", sublabel: "Followers", type: "db", layer: 3, col: 2 },
        { id: "cdn", label: "CDN", sublabel: "Media files", type: "cdn", layer: 3, col: 3 },
      ],
      edges: [
        { from: "user", to: "lb" },
        { from: "lb", to: "feed-api", label: "GET /feed" },
        { from: "lb", to: "post-svc", label: "POST /post" },
        { from: "post-svc", to: "post-db" },
        { from: "post-svc", to: "fanout" },
        { from: "fanout", to: "graph-db" },
        { from: "fanout", to: "timeline-cache" },
        { from: "feed-api", to: "timeline-cache" },
        { from: "feed-api", to: "ranking" },
        { from: "feed-api", to: "post-db", label: "pull fallback", dashed: true },
        { from: "post-svc", to: "cdn" },
      ],
    },
    {
      id: "feed-fanout",
      title: "Fanout Strategy",
      description: "Push for normal users, pull for celebrities",
      nodes: [
        { id: "author", label: "Author", type: "client", layer: 0, col: 1 },
        { id: "post-svc", label: "Post Service", type: "service", layer: 1, col: 1 },
        { id: "fanout", label: "Fanout Worker", type: "service", layer: 2, col: 0 },
        { id: "pull", label: "Pull on Read", sublabel: "celebrity posts", type: "service", layer: 2, col: 2 },
        { id: "cache-a", label: "User A Timeline", type: "cache", layer: 3, col: 0 },
        { id: "cache-b", label: "User B Timeline", type: "cache", layer: 3, col: 1 },
        { id: "cache-celeb", label: "Celebrity Feed", sublabel: "pull only", type: "cache", layer: 3, col: 2 },
      ],
      edges: [
        { from: "author", to: "post-svc" },
        { from: "post-svc", to: "fanout", label: "< 10K followers" },
        { from: "post-svc", to: "pull", label: "> 10K followers" },
        { from: "fanout", to: "cache-a" },
        { from: "fanout", to: "cache-b" },
        { from: "pull", to: "cache-celeb" },
      ],
    },
  ],
  "Design a rate limiter": [
    {
      id: "rate-overview",
      title: "Rate Limiter — High Level",
      description: "Middleware checks token bucket in Redis before hitting API",
      nodes: [
        { id: "client", label: "Client", type: "client", layer: 0, col: 1 },
        { id: "lb", label: "Load Balancer", type: "gateway", layer: 1, col: 1 },
        { id: "rl-mw", label: "Rate Limiter", sublabel: "Middleware", type: "gateway", layer: 2, col: 0 },
        { id: "api", label: "API Servers", type: "service", layer: 2, col: 2 },
        { id: "redis", label: "Redis Cluster", sublabel: "Token counters", type: "cache", layer: 3, col: 0 },
        { id: "rules", label: "Rules Config", sublabel: "Per user/IP limits", type: "storage", layer: 3, col: 2 },
      ],
      edges: [
        { from: "client", to: "lb" },
        { from: "lb", to: "rl-mw" },
        { from: "rl-mw", to: "redis", label: "check tokens" },
        { from: "rl-mw", to: "api", label: "allowed" },
        { from: "rl-mw", to: "client", label: "429 Too Many", dashed: true },
        { from: "rl-mw", to: "rules" },
      ],
    },
    {
      id: "rate-algorithm",
      title: "Sliding Window Algorithm",
      description: "Redis sorted set tracks request timestamps per user",
      nodes: [
        { id: "request", label: "Incoming Request", type: "client", layer: 0, col: 1 },
        { id: "limiter", label: "Rate Limiter", type: "service", layer: 1, col: 1 },
        { id: "redis", label: "Redis Sorted Set", sublabel: "user:123 → timestamps", type: "cache", layer: 2, col: 0 },
        { id: "allow", label: "Allow ✓", type: "service", layer: 2, col: 2 },
        { id: "deny", label: "Deny 429 ✗", type: "service", layer: 2, col: 3 },
      ],
      edges: [
        { from: "request", to: "limiter" },
        { from: "limiter", to: "redis", label: "ZCOUNT in window" },
        { from: "limiter", to: "allow", label: "count < limit" },
        { from: "limiter", to: "deny", label: "count >= limit" },
        { from: "limiter", to: "redis", label: "ZADD timestamp", dashed: true },
      ],
    },
  ],
  "Design YouTube": [
    {
      id: "youtube-overview",
      title: "YouTube — High Level Architecture",
      description: "Separate Upload path (Transcoding) and Playback path (CDN / Edge cache)",
      nodes: [
        { id: "uploader", label: "Video Creator", type: "client", layer: 0, col: 0 },
        { id: "viewer", label: "Video Viewer", type: "client", layer: 0, col: 2 },
        { id: "api-gw", label: "Zuul API Gateway", sublabel: "Routing / auth", type: "gateway", layer: 1, col: 1 },
        { id: "upload-svc", label: "Upload Service", sublabel: "Handles ingestion", type: "service", layer: 2, col: 0 },
        { id: "transcoder", label: "Transcoder Engine", sublabel: "Formats / resolutions", type: "service", layer: 3, col: 0 },
        { id: "storage", label: "Blob Storage", sublabel: "Master video chunks", type: "storage", layer: 4, col: 0 },
        { id: "cdn", label: "CDN Cache", sublabel: "Video playback edge", type: "cdn", layer: 4, col: 2 },
        { id: "meta-db", label: "Video Metadata DB", sublabel: "User / video records", type: "db", layer: 3, col: 1 },
        { id: "cache", label: "Redis Cache", sublabel: "Hot video metadata", type: "cache", layer: 3, col: 2 },
      ],
      edges: [
        { from: "uploader", to: "api-gw", label: "Upload stream" },
        { from: "viewer", to: "api-gw", label: "Search / comment" },
        { from: "viewer", to: "cdn", label: "GET video chunks" },
        { from: "api-gw", to: "upload-svc" },
        { from: "upload-svc", to: "transcoder" },
        { from: "transcoder", to: "storage" },
        { from: "storage", to: "cdn", label: "chunk fanout", dashed: true },
        { from: "api-gw", to: "meta-db" },
        { from: "meta-db", to: "cache" },
        { from: "api-gw", to: "cache" },
      ],
    },
  ],
  "Design Netflix": [
    {
      id: "netflix-overview",
      title: "Netflix — High Level Architecture",
      description: "AWS Control Plane / Playback API + Netflix Open Connect CDN Appliance Backbone",
      nodes: [
        { id: "viewer", label: "Netflix Device", sublabel: "TV / Mobile Client", type: "client", layer: 0, col: 1 },
        { id: "api-gateway", label: "Zuul Gateway", type: "gateway", layer: 1, col: 1 },
        { id: "playback-api", label: "Playback Service", sublabel: "Auth/DRM license", type: "service", layer: 2, col: 0 },
        { id: "rec-engine", label: "ML Recommendation", sublabel: "Custom feed", type: "service", layer: 2, col: 2 },
        { id: "open-connect", label: "Open Connect CDN", sublabel: "ISP co-located cache", type: "cdn", layer: 3, col: 1 },
        { id: "s3-storage", label: "Blob Storage", sublabel: "Master video storage", type: "storage", layer: 4, col: 0 },
        { id: "cassandra", label: "Cassandra", sublabel: "User playback metrics", type: "db", layer: 3, col: 0 },
      ],
      edges: [
        { from: "viewer", to: "api-gateway", label: "Auth / Browse" },
        { from: "api-gateway", to: "playback-api" },
        { from: "api-gateway", to: "rec-engine" },
        { from: "viewer", to: "open-connect", label: "Stream chunks" },
        { from: "open-connect", to: "s3-storage", label: "nightly sync", dashed: true },
        { from: "playback-api", to: "cassandra" },
      ],
    },
  ],
};

export function getDiagramsForQuestion(title: string): ArchitectureDiagram[] {
  const t = title.toLowerCase();
  if (t.includes("youtube")) return ARCHITECTURE_DIAGRAMS["Design YouTube"] || [];
  if (t.includes("netflix")) return ARCHITECTURE_DIAGRAMS["Design Netflix"] || [];
  return ARCHITECTURE_DIAGRAMS[title] ?? [];
}

export function getDiagram(title: string, diagramId: string): ArchitectureDiagram | null {
  const diagrams = getDiagramsForQuestion(title);
  return diagrams.find((d) => d.id === diagramId) ?? diagrams[0] ?? null;
}

export function pickDiagramForQuery(title: string, query: string): ArchitectureDiagram | null {
  const diagrams = getDiagramsForQuestion(title);
  if (diagrams.length === 0) return null;

  const q = query.toLowerCase();

  if (q.includes("read") || q.includes("redirect") || q.includes("lookup")) {
    return diagrams.find((d) => d.id.includes("read") || d.id.includes("redirect")) ?? diagrams[0];
  }
  if (q.includes("group") || q.includes("fan-out") || q.includes("fanout") || q.includes("delivery")) {
    return diagrams.find((d) => d.id.includes("group") || d.id.includes("fanout")) ?? diagrams[0];
  }
  if (q.includes("algorithm") || q.includes("token") || q.includes("sliding") || q.includes("window")) {
    return diagrams.find((d) => d.id.includes("algorithm")) ?? diagrams[0];
  }
  if (q.includes("write") || q.includes("create") || q.includes("post")) {
    return diagrams.find((d) => d.id.includes("fanout") || d.id.includes("write")) ?? diagrams[0];
  }
  if (q.includes("scale") || q.includes("deep") || q.includes("detail")) {
    return diagrams.length > 1 ? diagrams[1] : diagrams[0];
  }

  if (
    q.includes("architect") ||
    q.includes("diagram") ||
    q.includes("component") ||
    q.includes("design") ||
    q.includes("draw") ||
    q.includes("show") ||
    q.includes("visual")
  ) {
    return diagrams[0];
  }

  return null;
}

export function shouldIncludeDiagram(query: string): boolean {
  const q = query.toLowerCase();
  const triggers = [
    "architect", "diagram", "component", "design", "draw", "show", "visual",
    "flow", "structure", "layout", "system", "how does", "what does it look",
    "read path", "write path", "fanout", "fan-out", "algorithm", "scale",
    "start", "begin", "help with", "overview", "high level",
  ];
  return triggers.some((t) => q.includes(t));
}
