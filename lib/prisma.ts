// lib/prisma.ts

import { PrismaClient } from "@prisma/client";

// 1. Extend the global object with the prisma client type for TypeScript safety
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

// 2. Initialize Prisma Client only once globally, preventing multiple connections
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "info", "warn", "error"], // Recommended logging
  });

// 3. In development, attach the client to the global object
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// 4. Export the single, initialized instance
export default prisma;
