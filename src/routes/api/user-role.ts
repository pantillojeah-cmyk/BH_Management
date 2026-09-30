import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "@/lib/db";

export const Route = createFileRoute("/api/user-role")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const userId = url.searchParams.get("userId");
        if (!userId) return Response.json({ role: null });
        const role = await prisma.userRole.findFirst({ where: { userId } });
        return Response.json({ role: role ? role.role.toLowerCase() : null });
      },
      POST: async ({ request }: { request: Request }) => {
        try {
          const { userId, role } = await request.json() as { userId: string; role: string };
          if (!userId || !role) return Response.json({ error: "Missing userId or role" }, { status: 400 });
          const validRoles = ["admin", "owner", "customer"];
          if (!validRoles.includes(role)) return Response.json({ error: "Invalid role" }, { status: 400 });
          // create profile if missing
          await prisma.profile.upsert({
            where: { id: userId },
            create: { id: userId, fullName: "New User" },
            update: {},
          });
          await prisma.userRole.create({
            data: { userId, role: role as any },
          });
          return Response.json({ success: true });
        } catch (e) {
          return Response.json({ error: (e as Error).message }, { status: 500 });
        }
      },
    },
  },
});
