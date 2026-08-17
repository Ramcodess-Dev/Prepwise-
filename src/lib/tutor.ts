import { getDesignGuide, DESIGN_FRAMEWORK } from "./design-knowledge";
import {
  getDiagramsForQuestion,
  pickDiagramForQuery,
} from "./architecture-diagrams";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type DesignStep = "requirements" | "api" | "architecture" | "deep-dive";

export type TutorResponse = {
  reply: string;
  currentStep: DesignStep;
  nextStep: DesignStep | null;
  nextStepLabel: string;
  diagramId?: string;
  switchToDiagram?: boolean;
};

type QuestionContext = {
  title: string;
  description: string;
  category: string;
  answer: string;
};

const STEP_ORDER: DesignStep[] = ["requirements", "api", "architecture", "deep-dive"];

const STEP_LABELS: Record<DesignStep, string> = {
  requirements: "Requirements",
  api: "API & Data Model",
  architecture: "High-Level Design",
  "deep-dive": "Deep Dive",
};

function buildSystemPrompt(ctx: QuestionContext): string {
  const guide = getDesignGuide(ctx.title);
  const guideText = guide
    ? `\nKey components: ${guide.keyComponents.join("; ")}\nCommon pitfalls: ${guide.commonPitfalls.join("; ")}`
    : "";

  return `You are Prepwise Design Tutor — a step-by-step system design interview coach for "${ctx.title}".
Description: ${ctx.description}${guideText}

You guide through 4 steps ONLY in text (never describe drawing diagrams — user sees diagrams in a separate Architecture tab):
1. Requirements — clarify scope, scale, constraints
2. API & Data Model — entities, endpoints, data flow
3. High-Level Design — explain components and how they connect (text only)
4. Deep Dive — detail 1-2 critical components with trade-offs

Rules:
- Explain ONE step at a time, clearly and practically
- Always end with "**Next step:**" telling the user exactly what to do next
- Mention what each component is USED FOR (purpose), not just what it is
- Keep responses focused (3-5 short paragraphs max)
- Do NOT say "see the diagram below" — say "check the Architecture tab" if needed
- Be conversational, like a mentor walking them through an interview`;
}

export async function generateTutorResponse(
  messages: ChatMessage[],
  ctx: QuestionContext
): Promise<TutorResponse> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const query = lastUser?.content ?? "";

  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: buildSystemPrompt(ctx) },
            ...messages,
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content ?? "";
        const step = detectStep(query);
        const diagram = wantsDiagramView(query) ? pickDiagramForQuery(ctx.title, query) : null;
        return {
          reply: reply || fallbackResponse(messages, ctx).reply,
          currentStep: step,
          nextStep: getNextStep(step),
          nextStepLabel: getNextStepLabel(step),
          diagramId: diagram?.id,
          switchToDiagram: !!diagram,
        };
      }
    } catch {
      // fall through
    }
  }

  return fallbackResponse(messages, ctx);
}

function detectStep(query: string): DesignStep {
  const q = query.toLowerCase();
  if (q.includes("deep") || q.includes("detail") || q.includes("trade") || q.includes("shard") || q.includes("pitfall")) {
    return "deep-dive";
  }
  if (q.includes("architect") || q.includes("component") || q.includes("diagram") || q.includes("draw") || q.includes("show") || q.includes("visual")) {
    return "architecture";
  }
  if (q.includes("api") || q.includes("data model") || q.includes("schema") || q.includes("endpoint") || q.includes("entity")) {
    return "api";
  }
  if (q.includes("requirement") || q.includes("clarif") || q.includes("scale") || q.includes("start") || q.includes("begin") || q.includes("how do i")) {
    return "requirements";
  }
  return "requirements";
}

function getNextStep(step: DesignStep): DesignStep | null {
  const idx = STEP_ORDER.indexOf(step);
  return idx < STEP_ORDER.length - 1 ? STEP_ORDER[idx + 1] : null;
}

function getNextStepLabel(step: DesignStep): string {
  const next = getNextStep(step);
  return next ? `Move to ${STEP_LABELS[next]}` : "Review your full design";
}

function wantsDiagramView(query: string): boolean {
  const q = query.toLowerCase();
  return ["diagram", "draw", "visual", "show arch", "architecture tab", "see design", "show design", "show read", "show fanout", "show flow"].some((t) => q.includes(t));
}

function buildResponse(
  reply: string,
  step: DesignStep,
  ctx: QuestionContext,
  query: string
): TutorResponse {
  const diagram = wantsDiagramView(query) ? pickDiagramForQuery(ctx.title, query) : null;
  return {
    reply,
    currentStep: step,
    nextStep: getNextStep(step),
    nextStepLabel: getNextStepLabel(step),
    diagramId: diagram?.id,
    switchToDiagram: !!diagram,
  };
}

function fallbackResponse(messages: ChatMessage[], ctx: QuestionContext): TutorResponse {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const query = (lastUser?.content ?? "").toLowerCase();
  const guide = getDesignGuide(ctx.title);
  const step = detectStep(query);

  if (!lastUser) {
    return buildResponse(introMessage(ctx, guide), "requirements", ctx, query);
  }

  if (query.includes("next") || query.includes("what now") || query.includes("continue")) {
    return buildResponse(nextStepGuide(step, ctx, guide), step, ctx, query);
  }

  if (query.includes("start") || query.includes("begin") || query.includes("how do i")) {
    return buildResponse(stepRequirements(ctx, guide), "requirements", ctx, query);
  }

  if (query.includes("requirement") || query.includes("clarif")) {
    return buildResponse(stepRequirements(ctx, guide), "requirements", ctx, query);
  }

  if (query.includes("api") || query.includes("data model") || query.includes("schema")) {
    return buildResponse(stepApi(ctx, guide), "api", ctx, query);
  }

  if (query.includes("architect") || query.includes("component") || query.includes("diagram") || query.includes("draw") || query.includes("show")) {
    return buildResponse(stepArchitecture(ctx, guide), "architecture", ctx, query);
  }

  if (query.includes("deep") || query.includes("detail") || query.includes("explain the")) {
    return buildResponse(stepDeepDive(ctx, guide), "deep-dive", ctx, query);
  }

  if (query.includes("scale") || query.includes("million") || query.includes("billion")) {
    return buildResponse(scalingAdvice(ctx, guide), "architecture", ctx, query);
  }

  if (query.includes("trade") || query.includes("pitfall") || query.includes("mistake")) {
    return buildResponse(pitfallsAdvice(guide), "deep-dive", ctx, query);
  }

  if (query.includes("hint") || query.includes("tip") || query.includes("help")) {
    return buildResponse(hintsAdvice(ctx, guide), "requirements", ctx, query);
  }

  if (query.includes("review") || query.includes("feedback") || query.includes("my answer")) {
    return buildResponse(reviewPrompt(ctx), "deep-dive", ctx, query);
  }

  return buildResponse(contextualAnswer(query, ctx, guide), step, ctx, query);
}

function introMessage(
  ctx: QuestionContext,
  guide: ReturnType<typeof getDesignGuide>
): string {
  const overview = guide?.overview ?? ctx.description;
  return `Hey! I'll walk you through **${ctx.title}** step by step — like a real interview coach.

**The problem:** ${overview}

We'll go through 4 steps together:
1. Requirements — what to clarify first
2. API & Data Model — entities and endpoints
3. High-Level Design — components and how they connect
4. Deep Dive — trade-offs on critical parts

Visual diagrams live in the **Architecture tab** →. Here in chat, I'll explain each step in plain language.

**Next step:** Ask "How do I start?" or tap **Step 1: Requirements** below.`;
}

function stepRequirements(
  ctx: QuestionContext,
  guide: ReturnType<typeof getDesignGuide>
): string {
  const tips = DESIGN_FRAMEWORK[0].tips.map((t) => `- ${t}`).join("\n");

  return `**Step 1: Requirements** for ${ctx.title}

Before drawing anything, clarify these with your interviewer:

**Functional requirements** — what must the system do?
${guide ? guide.keyComponents.slice(0, 3).map((c) => `- ${c.split("—")[0].split("(")[0].trim()}`).join("\n") : "- Core features the user needs\n- Key operations (read vs write)"}

**Non-functional requirements** — how well must it perform?
- Expected scale (users, QPS, data size)
- Latency targets (e.g. redirects < 100ms)
- Availability (99.9%? 99.99%?)

**Questions to ask the interviewer:**
${tips}

Write your requirements in the **Requirements** section of your design canvas.

**Next step:** Once you have requirements, ask "Help with API design" to move to Step 2.`;
}

function stepApi(
  ctx: QuestionContext,
  guide: ReturnType<typeof getDesignGuide>
): string {
  return `**Step 2: API & Data Model** for ${ctx.title}

Now define WHAT data you store and HOW clients interact.

**Core entities** — nouns in the problem become tables/collections:
${guide?.keyComponents.map((c) => `- **${c.split("—")[0].split("(")[0].trim()}**`).join("\n") ?? "- Identify main entities from requirements"}

**Key API endpoints:**
- Write operations (create, update, delete)
- Read operations (get, list, search)
- Think: which endpoints are hot (high QPS)?

**Data model tips:**
- Choose IDs: auto-increment vs UUID vs hash
- Index columns used in lookups
- Separate hot path data from analytics/cold data

**Uses:** The API layer is how clients talk to your system. Every box in the Architecture tab maps to an endpoint or internal service call.

**Next step:** Ask "Explain the architecture" to move to Step 3 — I'll explain each component's purpose. Check the **Architecture tab** to see the visual layout.`;
}

function stepArchitecture(
  ctx: QuestionContext,
  guide: ReturnType<typeof getDesignGuide>
): string {
  const components = guide?.keyComponents ?? [];

  return `**Step 3: High-Level Design** for ${ctx.title}

Open the **Architecture tab** → to see the visual diagram. Here's what each layer does:

**Clients** — browsers, mobile apps. Send HTTP/WebSocket requests.

**Gateway / Load Balancer** — distributes traffic, handles SSL, rate limiting entry point.

**Services** — stateless business logic. Scale horizontally by adding more instances.
${components.map((c) => `- **${c}**`).join("\n")}

**Cache (Redis)** — stores hot data in memory. Used for: fast reads, session state, rate limit counters. Avoids hitting DB on every request.

**Database** — persistent storage. SQL for relational data, NoSQL for flexible/high-write schemas.

**How to present:** Explain the **read path** and **write path** separately. Point to each box in the Architecture tab as you talk.

**Next step:** Ask "Help with deep dive" or pick a component in the Architecture tab and ask about it.`;
}

function stepDeepDive(
  ctx: QuestionContext,
  guide: ReturnType<typeof getDesignGuide>
): string {
  return `**Step 4: Deep Dive** for ${ctx.title}

Pick 1–2 components from the Architecture tab and go deep. Interviewers probe here.

**What to cover for each component:**
- Why this technology? (trade-offs vs alternatives)
- How does it scale? (sharding, replication, partitioning)
- What happens when it fails? (fallback, retry, circuit breaker)
- Bottlenecks and how you'd fix them

${guide ? `**Good deep-dive targets for this problem:**
${guide.commonPitfalls.map((p) => `- ${p.replace("Not ", "Deep dive: ")}`).join("\n")}

**Follow-ups to prepare for:**
${guide.followUpQuestions.map((q) => `- ${q}`).join("\n")}` : ""}

**Next step:** Paste your notes and ask "Review my answer" — I'll give feedback on completeness.`;
}

function nextStepGuide(
  step: DesignStep,
  ctx: QuestionContext,
  guide: ReturnType<typeof getDesignGuide>
): string {
  const next = getNextStep(step);
  if (!next) {
    return `You've covered all 4 steps for **${ctx.title}**!

**Review checklist:**
1. ✓ Requirements — scope and scale clarified?
2. ✓ API — entities and endpoints defined?
3. ✓ Architecture — components explained (see Architecture tab)?
4. ✓ Deep dive — trade-offs on critical parts?

**Next step:** Ask "Review my answer" and paste your design canvas notes.`;
  }

  const handlers: Record<DesignStep, () => string> = {
    requirements: () => stepRequirements(ctx, guide),
    api: () => stepApi(ctx, guide),
    architecture: () => stepArchitecture(ctx, guide),
    "deep-dive": () => stepDeepDive(ctx, guide),
  };

  return `Moving you forward!

${handlers[next]()}`;
}

function scalingAdvice(
  ctx: QuestionContext,
  guide: ReturnType<typeof getDesignGuide>
): string {
  return `**Scaling ${ctx.title}:**

**Horizontal scaling** — add more stateless service instances behind a load balancer. Used when CPU/request handling is the bottleneck.

**Database scaling:**
- Read replicas — used for read-heavy workloads (feed reads, URL lookups)
- Sharding — partition data when single DB can't hold it all
- Caching (Redis) — used to avoid repeated DB hits on hot keys

**When to use what:**
- Cache → same data read many times (hot URLs, timelines)
- Queue → async work that doesn't need instant response (fanout, notifications)
- CDN → static content and cached redirects close to users

${guide ? `**For this problem specifically:**\n${guide.keyComponents.slice(0, 2).map((c) => `- ${c}`).join("\n")}` : ""}

**Next step:** Ask "Explain the architecture" — I'll walk through how these pieces connect. See the Architecture tab for the visual.`;
}

function pitfallsAdvice(guide: ReturnType<typeof getDesignGuide>): string {
  if (!guide) {
    return `Common pitfalls in system design interviews:

- Jumping to boxes before clarifying requirements
- Not stating what each component is USED FOR
- Ignoring failure modes ("what if Redis goes down?")
- No trade-off discussion ("I chose X because...")

**Next step:** Ask "How do I start?" to begin Step 1 properly.`;
  }

  return `**Common pitfalls for this problem:**

${guide.commonPitfalls.map((p) => `- ⚠️ ${p}`).join("\n")}

**Why these matter:** Interviewers ask follow-ups specifically on these gaps.

**Follow-ups to prepare:**
${guide.followUpQuestions.map((q) => `- ${q}`).join("\n")}

**Next step:** Go to the Architecture tab, click a component, and practice explaining its purpose out loud.`;
}

function hintsAdvice(
  ctx: QuestionContext,
  guide: ReturnType<typeof getDesignGuide>
): string {
  if (guide) {
    return `**Quick hints for ${ctx.title}:**

${guide.overview}

**Components you'll need (and why):**
${guide.keyComponents.map((c) => `- ${c}`).join("\n")}

**Next step:** Start with Step 1 — ask "Help with requirements". Use the Architecture tab to see how these connect visually.`;
  }

  return `**Hints for ${ctx.title}:** ${ctx.description}

**Next step:** Ask "How do I start?" for a step-by-step walkthrough.`;
}

function reviewPrompt(ctx: QuestionContext): string {
  return `I'll review your design! Paste your notes from each canvas section:

1. **Requirements** — what did you clarify?
2. **API & Data Model** — entities and endpoints?
3. **Architecture** — which components and why?
4. **Deep Dive** — trade-offs you discussed?

I'll tell you what's strong, what's missing, and what an interviewer would ask next.

**Tip:** Compare your architecture notes with the **Architecture tab** diagram — every box should be something you can explain.`;
}

function contextualAnswer(
  query: string,
  ctx: QuestionContext,
  guide: ReturnType<typeof getDesignGuide>
): string {
  if (guide) {
    const matched = guide.keyComponents.find((c) =>
      query.split(/\s+/).some((w) => w.length > 3 && c.toLowerCase().includes(w))
    );

    if (matched) {
      return `**About "${matched.split("—")[0].trim()}"** in ${ctx.title}:

**What it's used for:** Handles a critical part of the ${guide.overview.split(".")[0].toLowerCase()}.

**In your interview, explain:**
- Why you chose this approach over alternatives
- How it scales under load
- What happens when it fails

**See it in context:** Open the **Architecture tab** → and find this component in the diagram.

**Next step:** Ask "What's next?" to continue the step-by-step flow, or "Help with deep dive" for trade-offs.`;
    }
  }

  return `Let's keep going on **${ctx.title}**.

${guide?.overview ?? ctx.description}

**Where are you in the process?**
- Step 1: "Help with requirements"
- Step 2: "Help with API design"
- Step 3: "Explain the architecture" (+ Architecture tab)
- Step 4: "Help with deep dive"

**Next step:** Ask "How do I start?" if you're at the beginning, or "What's next?" to continue.`;
}
