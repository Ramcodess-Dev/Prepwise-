import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generateTutorResponse, type ChatMessage } from "@/lib/tutor";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { questionId, messages, whiteboardSummary } = await req.json();

  if (!questionId || !messages?.length) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  // Inject whiteboard context into the user's last message so the tutor responds to their sketch
  const processedMessages = [...messages];
  const lastIndex = processedMessages.length - 1;
  if (whiteboardSummary && lastIndex >= 0 && processedMessages[lastIndex].role === "user") {
    processedMessages[lastIndex] = {
      ...processedMessages[lastIndex],
      content: processedMessages[lastIndex].content + `\n\n[System Design Workspace Context:\n${whiteboardSummary}\nCritique this design or use this to address their queries regarding their architecture sketches.]`,
    };
  }

  const result = await generateTutorResponse(processedMessages as ChatMessage[], {
    title: question.title,
    description: question.description,
    category: question.category,
    answer: question.answer,
  });

  return NextResponse.json(result);
}
