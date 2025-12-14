import { Controller, Post, Body, UseGuards, Get, HttpCode, HttpStatus, Req, Res, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/common/roles.decorators';
import { Role } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Request, Response } from 'express';
import { Authorized } from 'src/common/autorized.decorator';
import { RecaptchaService } from 'src/config/recaptcha.config';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, 
    private readonly recaptchaService: RecaptchaService
  ) {}

  // ----------------- REGISTER -----------------
  @Post('register')
  @HttpCode(HttpStatus.OK)
  public async register(
    @Body() dto: RegisterDto,
     @Headers('recaptcha') recaptcha: string,
  ) {
    await this.recaptchaService.verify(recaptcha)
    return this.authService.register(dto);
  }

  // ----------------- LOGIN -----------------
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto
  ) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
     @Res({passthrough: true}) res: Response 
  ) {
    return this.authService.logOut(res);
  }

  // ----------------- ASSIGN ROLE -----------------
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @Post('assign-role')
  async assignRole(
    @Body() dto: { userId: string; role: Role },
    @Authorized('id') currentUserId: string,
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
