import { prisma } from "../config/db";

export function createEmailVerificationToken(
  userId: string,
  email: string,
  token: string,
  expiresAt: Date
) {
  return prisma.emailVerificationToken.create({
    data: {
      userId,
      email,
      token,
      expiresAt
    }
  });
}

export function findVerificationToken(token: string) {
  return prisma.emailVerificationToken.findFirst({
    where: {
      token
    },
    include: {
      user: true
    }
  });
}

export function deleteVerificationToken(token: string) {
  return prisma.emailVerificationToken.deleteMany({
    where: {
      token
    }
  });
}

export function deleteTokens(email: string) {
  return prisma.emailVerificationToken.deleteMany({
    where: {
      email
    }
  });
}