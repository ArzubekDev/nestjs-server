import { AuthModule } from 'src/auth/auth.module';
import { Module } from '@nestjs/common';
import { SoloModeService } from './solo.mode';
import { GamificationModule } from '../gamification/gamification.module';
import { SessionFlowModule } from '../flow/session-flow.module';

@Module({
  imports: [AuthModule,GamificationModule, SessionFlowModule],
  providers: [SoloModeService],
  exports: [SoloModeService],
})
export class SoloModeModule {}
