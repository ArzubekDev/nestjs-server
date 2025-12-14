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
import { AuthMethod, Role } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { resolve } from 'path';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

public async register(dto: RegisterDto, role: Role = Role.USER) {

  const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
  if (existing)
    throw new BadRequestException('Пользователь уже существует!!!');

  const hashed = await bcrypt.hash(dto.password, 10);


  const newUser = await this.prisma.user.create({
    data: {
      email: dto.email,
      password: hashed,
      name: dto.name,
      method: AuthMethod.CREDENTIALS,
      picture: "",
      isVerified: false,
      role: role
    }
  });

  // JWT токен түзүү
  const token = this.jwtService.generateToken(newUser.id, newUser.email, newUser.role);

  // Парольди чыгарып, колдонуучу маалыматтарын кайтаруу
  const { password: _, ...userData } = newUser;

  return { user: userData, token };
}


public async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Неверные учетные данные!!!');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Неверные учетные данные!!!');

    const token = this.jwtService.generateToken(user.id, user.email, user.role);
    return { user, token };
  }

  public async logOut(res: Response) {
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return { message: 'Пользователь успешно вышел' };
  }


public async assignRole(dto: { userId: string; role: Role }, currentUserId: string) {
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
