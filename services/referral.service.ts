import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createReferral(referrerId: string, referredId: string) {
    return prisma.referral.create({
        data: {
            referrerId,
            referredId,
        },
    });
}

export async function getReferrer(userId: string) {
    return prisma.referral.findFirst({
        where: { referredId: userId },
    });
}
