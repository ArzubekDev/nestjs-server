import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class LevelService {
  constructor(private prisma: PrismaService) {}

  private getLevelByPoints(points: number) {
    if (points >= 2500) return 'ELITE';
    if (points >= 1000) return 'PLATINUM';
    if (points >= 750) return 'GOLD';
    if (points >= 250) return 'SILVER';
    return 'BRONZE';
  }

  async updateUserLevel(userId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;

    const total = await db.points.aggregate({
      where: { userId },
      _sum: { value: true },
    });

    const totalPoints = total._sum.value ?? 0;
    const level = this.getLevelByPoints(totalPoints);

    await db.user.update({
      where: { id: userId },
      data: { level: level as any },
    });

    return level;
  }
}