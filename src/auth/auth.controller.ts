import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  Headers,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
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
import { AuthProviderGuard } from 'src/guards/provider.guard';
import { ConfigService } from '@nestjs/config';
import { ProviderService } from './provider/provider.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly recaptchaService: RecaptchaService,
    private readonly configService: ConfigService,
    private readonly providerService: ProviderService,
  ) {}

  // ----------------- REGISTER -----------------
  @Post('register')
  @HttpCode(HttpStatus.OK)
  public async register(
    @Body() dto: RegisterDto,
    @Headers('recaptcha') recaptcha: string,
  ) {
    await this.recaptchaService.verify(recaptcha);
    return this.authService.register(dto);
  }

  // ----------------- LOGIN -----------------
@Post('login')
@HttpCode(HttpStatus.OK)
async login(
  @Body() dto: LoginDto,
  @Res({ passthrough: true }) res: Response,
) {
  return this.authService.login(dto, res);
}


@UseGuards(AuthGuard)
@Get('me')
getMe(@Req() req) {
  return req.user;
}



@Get('/oauth/callback/:provider')
public async callback(
  @Req() req: Request,
  @Res({ passthrough: true }) res: Response,
  @Query('code') code: string,
  @Param('provider') provider: string,
) {
  if (!code) {
    throw new BadRequestException('Не был предоставлен код авторизации.');
  }

  await this.authService.extractProfileFromCode(req, provider, code, res);

  return res.redirect(
    `${this.configService.getOrThrow('ALLOWED_ORIGIN')}/dashboard/settings`,
  );
}


  @UseGuards(AuthProviderGuard)
  @Get('/oauth/connect/:provider')
  public async connect(@Param('provider') provider: string) {
    const providerIntance = this.providerService.findByService(provider);

    return {
      url: providerIntance?.getOAuthUrl(),
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
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
