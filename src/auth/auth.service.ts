import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAuthDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    console.log('findAll() called');
    return await this.prisma.user.findMany();
  }

  // async register(dto: CreateAuthDto) {
  //   return await this.prisma.user.create({

  //   });
  // }
}
