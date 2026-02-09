import { Injectable } from "@nestjs/common";
import { PointsService } from "./points.service";
import { LevelService } from "./level.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class GamificationService {
  constructor(
    private points: PointsService,
    private levels: LevelService,
  ) {}

  async handleCorrectAnswer(tx: Prisma.TransactionClient, payload: {
    userId: string;
    sessionId: string;
    answerId: string;
    maxPoints: number;
  }) {
    await this.points.rewardCorrectAnswer(tx, {
      userId: payload.userId,
      sessionId: payload.sessionId,
      answerId: payload.answerId,
      basePoints: payload.maxPoints,
    });

    await this.levels.updateUserLevel(payload.userId, tx);
  }
}