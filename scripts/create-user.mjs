#!/usr/bin/env node

/**
 * @deprecated This script is no longer used. User authentication is now handled
 * by an external credential database. Users are automatically synced to Prisma
 * when they log in via the NextAuth credentials provider.
 * 
 * This script is kept for reference but should not be used for creating users.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";
import { z } from "zod";

function printUsage() {
  console.log("Usage: node scripts/create-user.mjs --email <email> --password <password> [--name <display name>]");
  console.log("\n⚠️  WARNING: This script is deprecated.");
  console.log("User authentication is now handled by an external credential database.");
  console.log("Users are automatically synced to Prisma when they log in.");
}

function parseArgs(argv) {
  const result = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--help" || token === "-h") {
      result.help = true;
      continue;
    }

    if (!token.startsWith("--")) {
      throw new Error(`Unexpected argument: ${token}`);
    }

    const key = token.slice(2);
    const value = argv[index + 1];

    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    result[key] = value;
    index += 1;
  }

  return result;
}

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z
    .string()
    .min(1)
    .max(80)
    .optional()
    .transform((value) => value?.trim() || undefined),
});

function sanitizeName(input) {
  return input.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Ensure your environment variables are loaded.");
    process.exit(1);
  }

  const parsed = schema.safeParse({
    email: args.email,
    password: args.password,
    name: args.name,
  });

  if (!parsed.success) {
    console.error("Validation failed:");
    for (const issue of parsed.error.issues) {
      console.error(`- ${issue.path.join(".") || "value"}: ${issue.message}`);
    }
    console.log();
    printUsage();
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const email = parsed.data.email.toLowerCase();
    const name = parsed.data.name ? sanitizeName(parsed.data.name) : undefined;

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.error(`A user with email ${email} already exists (id: ${existing.id}).`);
      process.exit(1);
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
        createdAt: true,
      },
    });

    console.log("User created successfully:");
    console.log(`- id: ${user.id}`);
    console.log(`- email: ${user.email}`);
    console.log(`- role: ${user.role}`);
    console.log(`- createdAt: ${user.createdAt.toISOString()}`);
  } catch (error) {
    console.error("Failed to create user.");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Unexpected error.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
