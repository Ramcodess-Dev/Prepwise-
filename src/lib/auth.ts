import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SECRET = process.env.JWT_SECRET || "dev-secret";

export async function signToken(userId: string) {
  return jwt.sign({ userId }, SECRET, { expiresIn: "7d" });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, SECRET) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    return user;
  } catch {
    return null;
  }
}
