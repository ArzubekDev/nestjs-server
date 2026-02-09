import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { LevelService } from './level.service';
import { PointsService } from './points.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [GamificationService, LevelService, PointsService],
  exports: [GamificationService, LevelService, PointsService],
})
export class GamificationModule {}
