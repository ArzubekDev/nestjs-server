import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { Authorized } from 'src/common/autorized.decorator';
import { Authorization } from 'src/common/auth.decorator';
import { Role } from '@prisma/client';


@Controller('users')
export class UserController {
 constructor(private readonly userService: UserService){}

@Authorization()
@HttpCode(HttpStatus.OK)
@Get('profile')
 public async findProfile(@Authorized('id') userId: string) {
  return this.userService.findById(userId)
 }

@Authorization()
@HttpCode(HttpStatus.OK)
@Get('by-id/:id')
 public async findById(@Param('id') id: string) {
  return this.userService.findById(id)
 }
 

}