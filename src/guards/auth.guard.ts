import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from 'src/config/jwt.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1️⃣ token'ди cookie же header'ден алабыз
    const token =
      request.cookies?.session ||
      request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // 2️⃣ JWT текшерүү
    const payload = this.jwtService.verifyToken(token);
    if (!payload) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // 3️⃣ user жүктөө
    const user = await this.userService.findById(payload.id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    request.user = user;
    return true;
  }
}
