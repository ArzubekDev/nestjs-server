import { AuthModule } from 'src/auth/auth.module';
import { Module } from '@nestjs/common';
import { SessionFlowService } from './session-flow.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { QuizGateway } from '../quiz.gateway';

@Module({
    imports: [AuthModule],
  providers: [SessionFlowService, PrismaService, QuizGateway],
  exports: [SessionFlowService], 
})
export class SessionFlowModule {}