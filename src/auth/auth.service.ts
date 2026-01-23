import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtPayload, JwtService } from 'src/config/jwt.service';
import { AuthMethod, Role, TokenType, User } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { resolve } from 'path';
import { ProviderService } from './provider/provider.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly providerService: ProviderService,
  ) {}

  public async register(dto: RegisterDto, role: Role = Role.USER) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing)
      throw new BadRequestException('Пользователь уже существует!!!');

    const hashed = await bcrypt.hash(dto.password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        name: dto.name,
        method: AuthMethod.CREDENTIALS,
        picture: '',
        isVerified: false,
        role: role,
      },
    });

    // JWT токен түзүү
    const token = this.jwtService.generateToken(
      newUser.id,
      newUser.email,
      newUser.role,
    );

    // Парольди чыгарып, колдонуучу маалыматтарын кайтаруу
    const { password: _, ...userData } = newUser;

    return { user: userData, token };
  }
  private async saveSession(user: User, res: Response) {
    const token = this.jwtService.generateToken(user.id, user.email, user.role);

    await this.prisma.token.create({
      data: {
        sessionToken: token,
        type: TokenType.VERIFICATION,
        userId: user.id,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      domain: process.env.SESSION_DOMAIN,
      path: '/',
    });

    return { user };
  }

  public async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Неверные учетные данные');

    const match = await bcrypt.compare(dto.password, user.password!);
    if (!match) throw new UnauthorizedException('Неверные учетные данные');

    const token = this.jwtService.generateToken(user.id, user.email, user.role);

    res.cookie('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      path: '/',
    });

    return { user };
  }

  public async extractProfileFromCode(
    req: Request,
    provider: string,
    code: string,
    res: Response,
  ) {
    const providerInstance = this.providerService.findByService(provider);
    if (!providerInstance) {
      throw new BadRequestException('Unknown provider');
    }

    const profile = await providerInstance.findUserByCode(code);
    if (!profile) {
      throw new UnauthorizedException('Profile not found');
    }

    const account = await this.prisma.account.findFirst({
      where: {
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      },
    });

    if (account) {
      const user = await this.userService.findById(account.userId);
      if (!user) {
        throw new InternalServerErrorException('User not found');
      }
      return this.saveSession(user, res);
    }

    let user: User | null = null;

    if (profile.email) {
      user = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });
    }

    const providerToAuthMethod: Record<string, AuthMethod> = {
      google: AuthMethod.GOOGLE,
      github: AuthMethod.GITHUB,
    };

    const authMethod = providerToAuthMethod[profile.provider];

    if (!authMethod) {
      throw new BadRequestException('Unsupported auth provider');
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email:
            profile.email ?? `${profile.providerAccountId}@${provider}.oauth`,
          name: profile.name,
          picture: profile.picture,
          method: authMethod,
          isVerified: true,
          role: Role.USER,
        },
      });
    }

    await this.prisma.account.create({
      data: {
        userId: user.id,
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
        access_token: profile.access_token,
      },
    });

    return this.saveSession(user, res);
  }

  public async logOut(res: Response) {
    res.clearCookie('session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
    });

    return { message: 'Пользователь успешно вышел' };
  }

  public async assignRole(
    dto: { userId: string; role: Role },
    currentUserId: string,
  ) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!currentUser)
      throw new UnauthorizedException('Текущий пользователь не найден!!!');

    if (currentUser.role !== Role.OWNER) {
      throw new ForbiddenException('Только ВЛАДЕЛЕЦ может назначать роли!');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: dto.userId },
      data: { role: dto.role },
    });

    return updatedUser;
  }

  verifyToken(token: string): JwtPayload | null {
    return this.jwtService.verifyToken(token);
  }
}
