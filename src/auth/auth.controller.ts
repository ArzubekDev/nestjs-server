import { Body, Controller, Get, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/auth.dto';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.authService.findAll();
  }

  // @Post()
  // @UsePipes(new ValidationPipe({ whitelist: true }))
  // create(@Body() dto: CreateAuthDto) {
  //   return this.authService.create(dto);
  // }
}
