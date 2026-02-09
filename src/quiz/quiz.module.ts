import { QuizGateway } from './quiz.gateway';
import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { GamificationService } from './gamification/gamification.service';
import { PointsService } from './gamification/points.service';
import { LevelService } from './gamification/level.service';
import { SoloModeModule } from './mode/solo.module';
import { LobbyModeModule } from './mode/lobby.module';

@Module({
  imports: [AuthModule, UserModule, SoloModeModule, LobbyModeModule],
  controllers: [QuizController],
  providers: [
    QuizService,
    QuizGateway,
    PrismaService,
    GamificationService,
    PointsService,
    LevelService,
  ],
})
export class QuizModule {}
