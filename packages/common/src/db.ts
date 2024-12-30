import { PrismaClient } from "@prisma/client";
let prisma: PrismaClient | null = null;
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};
export const db = (() => {
  if (typeof window === 'undefined') {
    if (!prisma) {
      prisma = createPrismaClient();
    }
    return prisma;
  } else {
    // Optional: You can throw an error or return null to indicate that this should not be used on the client side.
    return null
  }
})();
