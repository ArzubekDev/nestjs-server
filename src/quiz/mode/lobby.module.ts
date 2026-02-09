import { AuthModule } from 'src/auth/auth.module';
import { Module } from '@nestjs/common';
import { LobbyModeService } from './lobby.mode';
import { GamificationModule } from '../gamification/gamification.module';
import { SessionFlowModule } from '../flow/session-flow.module';

@Module({
  imports: [AuthModule,GamificationModule, SessionFlowModule],
  providers: [LobbyModeService],
  exports: [LobbyModeService],
})
export class LobbyModeModule {}
