import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/common/roles.decorators';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ----------------- REGISTER -----------------
  @Post('register')
  async register(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('name') name: string,
  ) {
    return this.authService.register(email, password, name);
  }

  // ----------------- LOGIN -----------------
  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.login(email, password);
  }

  // ----------------- ASSIGN ROLE -----------------
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @Post('assign-role')
  async assignRole(
    @Body() dto: { userId: string; role: Role },
    @Body('currentUserId') currentUserId: string,
  ) {
    return this.authService.assignRole(dto, currentUserId);
  }

  // ----------------- ADMIN PANEL -----------------
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin-panel')
  getAdminPanel() {
    return 'Welcome Admin!';
  }
}
