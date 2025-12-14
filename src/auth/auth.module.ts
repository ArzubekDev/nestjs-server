import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtService } from 'src/config/jwt.service';
import { UserService } from 'src/user/user.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { RecaptchaService } from 'src/config/recaptcha.config';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController], 
  providers: [AuthService, JwtService, UserService, AuthGuard, RecaptchaService],
  exports: [AuthService, JwtService, AuthGuard, RecaptchaService],
})
export class AuthModule {}
