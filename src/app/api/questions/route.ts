import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const where = category ? { category } : {};
  const questions = await prisma.question.findMany({ where, orderBy: { title: "asc" } });
  return NextResponse.json(questions);
}
