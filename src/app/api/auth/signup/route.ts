import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, name, password } = await req.json();

  if (!email || !name || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, name, password: hashed },
  });

  const token = await signToken(user.id);
  const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  res.cookies.set("token", token, { httpOnly: true, secure: false, path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
