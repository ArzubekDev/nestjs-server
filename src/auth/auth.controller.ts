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
import { Public } from 'src/common/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly recaptchaService: RecaptchaService,
    private readonly configService: ConfigService,
    private readonly providerService: ProviderService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  public async register(
    @Body() dto: RegisterDto,
    @Headers('recaptcha') recaptcha: string,
  ) {
    await this.recaptchaService.verify(recaptcha);
    return this.authService.register(dto);
  }

@Post('login')
@HttpCode(HttpStatus.OK)
async login(
  @Body() dto: LoginDto,
  @Res({ passthrough: true }) res: Response,
) {
  return this.authService.login(dto);
}


@UseGuards(AuthGuard)
@Get('me')
getMe(@Req() req: Request) {
  return req.user;
}


// @Public()
// @Get('/oauth/callback/:provider')
// public async callback(
//   @Req() req: Request,
//   @Res({ passthrough: true }) res: Response,
//   @Query('code') code: string,
//   @Param('provider') provider: string,
// ) {
//   if (!code) {
//     throw new BadRequestException('Не был предоставлен код авторизации.');
//   }

//   await this.authService.extractProfileFromCode(req, provider, code, res);

//   return res.redirect(
//   `${this.configService.getOrThrow('ALLOWED_ORIGIN')}?auth=success`,
// );

// }

@Public()
@Get('/oauth/callback/:provider')
async callback(
  @Query('code') code: string,
  @Param('provider') provider: string,
  @Req() req: Request,
  @Res() res: Response,
) {
  if (!code) {
    throw new BadRequestException('No auth code');
  }

  const { accessToken } =
    await this.authService.extractProfileFromCode(
      req,
      provider,
      code,
      res,
    );

  return res.redirect(
  `${this.configService.getOrThrow("ALLOWED_ORIGIN")}/callback?token=${accessToken}`
);
}



  @Public()
  @UseGuards(AuthProviderGuard)
  @Get('/oauth/connect/:provider')
  public async connect(@Param('provider') provider: string) {
    const providerIntance = this.providerService.findByService(provider);

    return {
      url: providerIntance?.getOAuthUrl(),
    };
  }

  // @Post('logout')
  // @HttpCode(HttpStatus.OK)
  // async logout(@Res({ passthrough: true }) res: Response) {
  //   return this.authService.logOut(res);
  // }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @Post('assign-role')
  async assignRole(
    @Body() dto: { userId: string; role: Role },
    @Authorized('id') currentUserId: string,
  ) {
    return this.authService.assignRole(dto, currentUserId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @Get('admin-panel')
  getAdminPanel() {
    return 'Welcome Admin!';
  }
}
