import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsersLeaderboard() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        picture: true,
        level: true,
        role: true,
        quizParticipants: { select: { score: true } }, // SOLO session scores
        points: { select: { value: true } },           // Points table
      },
    });

    return users
      .map(user => {
        const totalScore =
          user.quizParticipants.reduce((acc, p) => acc + p.score, 0) +
          user.points.reduce((acc, p) => acc + p.value, 0);

        return {
          userId: user.id,
          name: user.name,
          level: user.level,
          role: user.role,
          picture: user.picture,
          score: totalScore,
        };
      })
      .sort((a, b) => b.score - a.score); // Descending
  }
}
