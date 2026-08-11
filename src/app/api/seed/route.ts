import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const count = await prisma.question.count();
  if (count > 0) return NextResponse.json({ message: "Already seeded" });

  const questions = [
    {
      category: "behavioral",
      title: "Tell me about yourself",
      description: "Walk through your background, experience, and why you're a good fit.",
      answer: "Start with your current role, then briefly cover past experience relevant to the position, and conclude with why you're excited about this opportunity. Keep it to 2 minutes.",
      difficulty: "easy",
    },
    {
      category: "behavioral",
      title: "Tell me about a time you faced a challenge",
      description: "Describe a difficult situation and how you overcame it.",
      answer: "Use the STAR method: Situation, Task, Action, Result. Pick a specific example where your actions led to a measurable positive outcome.",
      difficulty: "medium",
    },
    {
      category: "behavioral",
      title: "Why do you want to work here?",
      description: "Explain your motivation for joining this specific company.",
      answer: "Research the company's mission, products, and culture. Connect your personal values and career goals to what the company offers.",
      difficulty: "easy",
    },
    {
      category: "behavioral",
      title: "Describe a conflict with a coworker",
      description: "How did you handle a disagreement in a professional setting?",
      answer: "Focus on communication and compromise. Show that you listened, respected their perspective, and found a middle ground that worked for both parties.",
      difficulty: "medium",
    },
    {
      category: "technical",
      title: "Reverse a linked list",
      description: "Implement a function to reverse a singly linked list.",
      answer: "Use three pointers (prev, curr, next). Iterate through the list, reversing each node's next pointer. Return the new head (prev). O(n) time, O(1) space.",
      difficulty: "medium",
    },
    {
      category: "technical",
      title: "Two Sum",
      description: "Find two numbers in an array that add up to a target.",
      answer: "Use a hash map to store complements. Iterate through the array once, checking if the complement exists. O(n) time, O(n) space.",
      difficulty: "easy",
    },
    {
      category: "technical",
      title: "Design a rate limiter",
      description: "Design a system that limits API requests per user.",
      answer: "Use a sliding window or token bucket algorithm. Store request timestamps per user. On each request, remove timestamps outside the window and check if count exceeds the limit.",
      difficulty: "hard",
    },
    {
      category: "system-design",
      title: "Design a URL shortener",
      description: "Design a service like TinyURL.",
      answer: "Use a hash function (base62) to generate short codes. Store mappings in a database with expiration. Use a cache layer (Redis) for hot URLs. Redirect with HTTP 301.",
      difficulty: "medium",
    },
    {
      category: "system-design",
      title: "Design a chat system",
      description: "Design a real-time messaging system like WhatsApp.",
      answer: "Use WebSockets for real-time communication. Store messages in a database. Use message queues for delivery. Support offline messages via push notifications. Shard by user ID.",
      difficulty: "hard",
    },
    {
      category: "system-design",
      title: "Design a news feed",
      description: "Design a social media feed like Facebook or Twitter.",
      answer: "Use a fanout approach: push writes to followers' timelines for active users (push), pull for inactive users (pull). Cache timelines in Redis. Use a ranking algorithm for relevance.",
      difficulty: "hard",
    },
  ];

  await prisma.question.createMany({ data: questions });
  return NextResponse.json({ message: `Seeded ${questions.length} questions` });
}
