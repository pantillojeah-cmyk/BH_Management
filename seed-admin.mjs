/**
 * seed-admin.mjs  (fixed — uses exact Better Auth scrypt params)
 * Run: node seed-admin.mjs
 *
 * Credentials created:
 *   Email   : admin@boarding.com
 *   Password: Admin@1234
 */

import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt } from "node:crypto";

const prisma = new PrismaClient();

// ── Admin credentials ────────────────────────────────────────────────
const ADMIN_EMAIL    = "admin@boarding.com";
const ADMIN_PASSWORD = "Admin@1234";
const ADMIN_NAME     = "Admin";
// ────────────────────────────────────────────────────────────────────

/** Exact same logic as @better-auth/utils/dist/password.node.mjs */
const SCRYPT_CONFIG = { N: 16384, r: 16, p: 1, dkLen: 64 };

function generateKey(password, salt) {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      SCRYPT_CONFIG.dkLen,
      {
        N: SCRYPT_CONFIG.N,
        r: SCRYPT_CONFIG.r,
        p: SCRYPT_CONFIG.p,
        maxmem: 128 * SCRYPT_CONFIG.N * SCRYPT_CONFIG.r * 2, // ~64 MB
      },
      (err, key) => {
        if (err) reject(err);
        else resolve(key);
      }
    );
  });
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key  = await generateKey(password, salt);
  return `${salt}:${key.toString("hex")}`;
}

// ────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Remove any previously seeded admin with a bad hash
  const existingUser = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existingUser) {
    console.log("🗑  Removing previously created admin user (bad password hash)…");
    await prisma.user.delete({ where: { id: existingUser.id } });
    console.log("   Done.");
  }

  // 2. Check no other admin exists
  const adminRole = await prisma.userRole.findFirst({ where: { role: "admin" } });
  if (adminRole) {
    console.log("✅ A different admin already exists — no changes made.");
    return;
  }

  // 3. Hash the password the same way Better Auth does
  console.log("🔐 Hashing password…");
  const hashedPw = await hashPassword(ADMIN_PASSWORD);

  // 4. Generate a cuid2-like ID (simple random fallback)
  const userId = randomBytes(12).toString("base64url").slice(0, 20);
  const now    = new Date();

  // 5. Insert everything in a transaction
  await prisma.$transaction([
    prisma.user.create({
      data: {
        id: userId,
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    }),
    prisma.account.create({
      data: {
        userId,
        accountId: userId,
        providerId: "credential",
        password: hashedPw,
        createdAt: now,
        updatedAt: now,
      },
    }),
    prisma.profile.create({
      data: { id: userId, fullName: ADMIN_NAME, email: ADMIN_EMAIL },
    }),
    prisma.userRole.create({
      data: { userId, role: "admin" },
    }),
  ]);

  console.log("\n✅ Admin account created successfully!");
  console.log(`   Email   : ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log("\n👉 Sign in at http://localhost:8080/auth");
}

main()
  .catch((e) => { console.error("❌ Error:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
