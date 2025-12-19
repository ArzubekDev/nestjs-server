import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtService } from 'src/config/jwt.service';
import { UserService } from 'src/user/user.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { RecaptchaService } from 'src/config/recaptcha.config';
import { ProviderModule } from './provider/provider.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getProvidersConfig } from 'src/config/providers.config';


@Module({
  imports: [PrismaModule, ProviderModule.registerAsync({
    imports: [ConfigModule],
    useFactory: getProvidersConfig,
    inject: [ConfigService]
  })],
  controllers: [AuthController], 
  providers: [AuthService, JwtService, UserService, AuthGuard, RecaptchaService],
  exports: [AuthService, JwtService, AuthGuard, RecaptchaService],
})
export class AuthModule {}
