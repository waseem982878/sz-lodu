import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function updateUserKycStatus(userId: string, status: string): Promise<User> {
    return prisma.user.update({
        where: { id: userId },
        data: { kycStatus: status },
    });
}

export async function getUserById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id: userId } });
}
