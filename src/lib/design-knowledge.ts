export type DesignSection = {
  id: string;
  title: string;
  prompt: string;
  tips: string[];
};

export const DESIGN_FRAMEWORK: DesignSection[] = [
  {
    id: "requirements",
    title: "Requirements",
    prompt: "Clarify functional and non-functional requirements. Ask about scale, users, and constraints.",
    tips: [
      "Functional: What features must the system support?",
      "Non-functional: latency, availability, consistency, throughput",
      "Scale: DAU, QPS, data size, growth rate",
      "Constraints: budget, timeline, team size",
    ],
  },
  {
    id: "api",
    title: "API & Data Model",
    prompt: "Define core entities, relationships, and the main API endpoints.",
    tips: [
      "Identify nouns in the problem → entities",
      "Define CRUD operations for each entity",
      "Choose read-heavy vs write-heavy patterns",
      "Consider idempotency for critical writes",
    ],
  },
  {
    id: "architecture",
    title: "High-Level Design",
    prompt: "Draw the major components: clients, load balancers, services, databases, caches, queues.",
    tips: [
      "Start with a simple monolith, then split bottlenecks",
      "Add a cache layer for hot reads",
      "Use message queues for async work",
      "Plan for horizontal scaling from day one",
    ],
  },
  {
    id: "deep-dive",
    title: "Deep Dive",
    prompt: "Pick 1–2 critical components and explain them in detail with trade-offs.",
    tips: [
      "Database sharding / partitioning strategy",
      "Caching invalidation strategy",
      "Consistency vs availability trade-offs",
      "Failure modes and how you handle them",
    ],
  },
];

export type QuestionDesignGuide = {
  overview: string;
  keyComponents: string[];
  commonPitfalls: string[];
  followUpQuestions: string[];
};

export const DESIGN_GUIDES: Record<string, QuestionDesignGuide> = {
  "Design a URL shortener": {
    overview:
      "A URL shortener maps long URLs to short codes. Core challenges: generating unique short codes at scale, fast redirects, and analytics.",
    keyComponents: [
      "Hash function (base62) or counter-based ID generation",
      "Key-value store for short → long URL mapping",
      "Redis cache for hot URLs (301 redirects)",
      "Optional: analytics DB for click tracking",
    ],
    commonPitfalls: [
      "Not handling hash collisions",
      "Forgetting expiration / TTL for URLs",
      "Using 302 instead of 301 (hurts SEO, adds latency)",
    ],
    followUpQuestions: [
      "How do you handle custom aliases?",
      "What if two users shorten the same URL?",
      "How do you scale to 100M URLs/day?",
    ],
  },
  "Design a chat system": {
    overview:
      "Real-time messaging requires low-latency delivery, offline support, and message ordering. WebSockets for online users, push for offline.",
    keyComponents: [
      "WebSocket gateway for real-time connections",
      "Message service with persistent storage",
      "Message queue (Kafka/RabbitMQ) for delivery",
      "Presence service (online/offline status)",
      "Push notification service for offline users",
    ],
    commonPitfalls: [
      "Not handling message ordering in group chats",
      "Ignoring offline message delivery",
      "Single WebSocket server (no horizontal scaling)",
    ],
    followUpQuestions: [
      "How do you handle group chats with 1000+ members?",
      "End-to-end encryption — how does key exchange work?",
      "How do you show 'typing' indicators at scale?",
    ],
  },
  "Design a news feed": {
    overview:
      "A news feed aggregates posts from followed users, ranked by relevance/recency. The fanout problem is the core challenge.",
    keyComponents: [
      "Post service (write path)",
      "Fanout service (push to follower timelines)",
      "Timeline cache (Redis sorted sets)",
      "Ranking / relevance engine",
      "Media storage (CDN for images/videos)",
    ],
    commonPitfalls: [
      "Pure push fanout fails for celebrities with millions of followers",
      "Not caching timelines — every page load hits DB",
      "Ignoring feed ranking / personalization",
    ],
    followUpQuestions: [
      "Push vs pull fanout — when to use each?",
      "How do you rank posts for relevance?",
      "How do you handle real-time updates vs polling?",
    ],
  },
  "Design a rate limiter": {
    overview:
      "Rate limiting protects APIs from abuse. Must be fast (in-memory), distributed (shared state), and accurate.",
    keyComponents: [
      "Token bucket or sliding window algorithm",
      "Redis for distributed counter state",
      "Middleware layer intercepting requests",
      "Rate limit headers (X-RateLimit-Remaining)",
    ],
    commonPitfalls: [
      "Race conditions in distributed counters",
      "Not returning proper 429 status codes",
      "Fixed window causing burst at window boundaries",
    ],
    followUpQuestions: [
      "Token bucket vs sliding window — trade-offs?",
      "How do you rate limit per user AND per IP?",
      "What happens when Redis goes down?",
    ],
  },
};

export function getDesignGuide(title: string): QuestionDesignGuide | null {
  return DESIGN_GUIDES[title] ?? null;
}
