import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('all')
  @HttpCode(HttpStatus.OK)
  async getAll() {
    return this.leaderboardService.getAllUsersLeaderboard();
  }
}
