import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stats = req.nextUrl.searchParams.get("stats");

  if (stats) {
    const sessions = await prisma.practiceSession.findMany({ where: { userId: user.id } });
    const completed = sessions.filter((s) => s.status === "completed");
    const total = sessions.length;
    const avgScore = completed.length
      ? Math.round((completed.reduce((a, s) => a + (s.score || 0), 0) / completed.length) * 10)
      : 0;
    return NextResponse.json({ total, completed: completed.length, averageScore: avgScore });
  }

  const sessions = await prisma.practiceSession.findMany({
    where: { userId: user.id },
    include: { question: { select: { title: true, category: true } } },
    orderBy: { startedAt: "desc" },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { questionId } = await req.json();
  const session = await prisma.practiceSession.create({
    data: { userId: user.id, questionId },
  });
  return NextResponse.json(session);
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId, notes, score } = await req.json();
  const session = await prisma.practiceSession.update({
    where: { id: sessionId, userId: user.id },
    data: { status: "completed", notes, score, completedAt: new Date() },
  });
  return NextResponse.json(session);
}
