import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/common/roles.decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
@Get('/admin-panel')
getAdminPanel() {
  return "Welcome Admin!";
}


}
