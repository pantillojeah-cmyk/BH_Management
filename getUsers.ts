import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.user.findMany({ include: { roles: true } })
  .then(users => console.log(JSON.stringify(users, null, 2)))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
