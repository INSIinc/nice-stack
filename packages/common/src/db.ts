import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | null = null;

const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

export const db = (() => {
  if (!prisma) {
    prisma = createPrismaClient();
  }
  return prisma;
})();
