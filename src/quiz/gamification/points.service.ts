import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class PointsService {
  constructor(private prisma: PrismaService) {}

  async rewardCorrectAnswer(tx: Prisma.TransactionClient, data: {
    userId: string;
    sessionId: string;
    answerId: string;
    basePoints: number;
  }) {
    await tx.points.create({
      data: {
        userId: data.userId,
        sessionId: data.sessionId,
        answerId: data.answerId,
        value: data.basePoints,
        reason: 'Correct answer',
      },
    });

    await tx.quizParticipant.update({
      where: {
        userId_sessionId: {
          userId: data.userId,
          sessionId: data.sessionId,
        },
      },
      data: {
        score: { increment: data.basePoints },
      },
    });
  }
}