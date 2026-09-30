import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    "http://localhost:5173",
    "https://bh-management.onrender.com",
    process.env.BETTER_AUTH_URL,
    process.env.VITE_APP_URL,
  ].filter((url): url is string => Boolean(url)),
});
