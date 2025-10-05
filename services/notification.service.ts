import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getNotifications(userId: string) {
    return prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
}

export async function createNotification(userId: string, message: string) {
    return prisma.notification.create({
        data: {
            userId,
            message,
        },
    });
}
