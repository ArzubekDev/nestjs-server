import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthModule } from 'src/auth/auth.module';
import { AuthGuard } from 'src/guards/auth.guard';

@Module({
  controllers: [UserController],
  providers: [UserService, AuthGuard],
  imports: [AuthModule],
  exports: [UserService],
})
export class UserModule {}
