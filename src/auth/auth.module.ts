import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtService } from 'src/config/jwt.service';

@Module({
  imports: [PrismaModule],   // PrismaService үчүн
  providers: [AuthService, JwtService], // Бул жерде JwtService provider катары кошулат
  exports: [AuthService],
})
export class AuthModule {}
