import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtPayload, JwtService } from 'src/config/jwt.service';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    email: string,
    password: string,
    name: string,
    role: Role = Role.USER,
  ) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing)
      throw new BadRequestException('Пользователь уже существует!!!');

    const hashed = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: { email, password: hashed, role, name },
    });

    const token = this.jwtService.generateToken(user.id, user.email, user.role);

    const { password: _, ...userData } = user;

    return { user: userData, token };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Неверные учетные данные!!!');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Неверные учетные данные!!!');

    const token = this.jwtService.generateToken(user.id, user.email, user.role);
    return { user, token };
  }

  async assignRole(dto: { userId: string; role: Role }, currentUserId: string) {
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
