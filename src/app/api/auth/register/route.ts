import { hash } from "bcrypt";
import { NextRequest } from "next/server";

import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { cleanContent } from "@/lib/sanitize";
import { registerSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = registerSchema.safeParse(raw);

    if (!parsed.success) {
      return jsonError(parsed.error.message, 400);
    }

    const email = parsed.data.email.toLowerCase();
    const name = parsed.data.name ? cleanContent(parsed.data.name) : undefined;

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return jsonError("An account with that email already exists.", 409);
    }

    const passwordHash = await hash(parsed.data.password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: passwordHash,
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        createdAt: true,
      },
    });

    return jsonOk(user, { status: 201 });
  } catch (error) {
    console.error(error);
    return jsonError("Failed to register user.", 500);
  }
}
