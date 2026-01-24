import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import jwt, { SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
  name?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtService {
  generateToken(userId: string, email: string, role: Role, name?: string) {
    const secret = process.env.JWT_SECRET!;
    if (!secret) throw new Error('Параметр JWT_SECRET не задан в файле .env!!!');

    const payload = { id: userId, email, role, name};
    const options: SignOptions = {
      expiresIn: process.env.JWT_EXPIRES_IN as SignOptions['expiresIn'] || '7d',
    };

    return jwt.sign(payload, secret, options);
  }

  verifyToken(token: string): JwtPayload | null {
    const secret = process.env.JWT_SECRET!;
    if (!secret) throw new Error('JWT_SECRET not set in .env');

    try {
      const decoded = jwt.verify(token, secret);
      if (typeof decoded !== 'object' || decoded === null) return null;
      if (!('id' in decoded) || !('email' in decoded)) return null;

      return decoded as JwtPayload;
    } catch {
      return null;
    }
  }
}
