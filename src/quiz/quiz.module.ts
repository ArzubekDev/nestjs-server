import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { JwtService } from 'src/config/jwt.service';

@Module({
   imports: [AuthModule, UserModule],
  controllers: [QuizController],
  providers: [QuizService, PrismaService, JwtService,
    UserService,
    AuthGuard,],
})
export class QuizModule {}
