import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getTransactionsByUserId(userId: string) {
    return prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
}
