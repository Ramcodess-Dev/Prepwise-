import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generateTutorResponse, type ChatMessage } from "@/lib/tutor";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { questionId, messages } = await req.json();

  if (!questionId || !messages?.length) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const result = await generateTutorResponse(messages as ChatMessage[], {
    title: question.title,
    description: question.description,
    category: question.category,
    answer: question.answer,
  });

  return NextResponse.json(result);
}
