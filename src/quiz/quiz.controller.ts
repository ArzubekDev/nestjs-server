import { Controller, Post, Body, Get, Query, Param, Req, UseGuards } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import {
  CreateCategoryDto,
  CreateQuizDto,
  GetQuestionsQueryDto,
} from './dto/create-quiz.dto';
import { Authorization } from 'src/common/auth.decorator';
import { Authorized } from 'src/common/autorized.decorator';
import { CreateSessionDto, StartSessionDto } from './dto/create-session.dto';
import { JwtService } from 'src/config/jwt.service';
import { UserService } from 'src/user/user.service';
import { Public } from 'src/common/public.decorator';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('quiz')
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  // Category
  @Public()
  @Post('category')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.quizService.createCategory(dto);
  }

  @Public()
  @Get('category')
  findAllCategory() {
    return this.quizService.findAllCategories();
  }

  // Question
  @Public()
  @Post('question')
  createQuestion(@Body() dto: CreateQuizDto) {
    return this.quizService.createQuestion(dto);
  }

  @Public()
  @Get('question')
  findQuestion(@Query() query: GetQuestionsQueryDto) {
    return this.quizService.getQuestionsByCategory(query);
  }

  @Authorization()
  @Get('session/:id/current-question')
  getCurrentQuestion(
    @Param('id') sessionId: string,
    @Authorized('id') userId: string,
  ) {
    return this.quizService.getCurrentQuestion(sessionId, userId);
  }

  // SubmitAnswer
  @Authorization()
  @Post('answer')
  submit(@Authorized('id') userId: string, @Body() dto: SubmitAnswerDto) {
    return this.quizService.submitAnswer(userId, dto);
  }

  // CREATE SESSION (SOLO / LOBBY)
  @Authorization()
  @Post('session')
  createSession(
    @Authorized('id') userId: string,
    @Body() dto: CreateSessionDto,
  ) {
    return this.quizService.createSession(userId, dto);
  }

  // GetSession
  @Public()
  @Get('session/:id')
  getSessionById(@Param('id') id: string) {
    return this.quizService.getSessionById(id);
  }

  @Public()
@Get('session/code/:code')
getSessionByCode(@Param('code') code: string) {
  return this.quizService.getSessionByCode(code);
}

@Authorization()
@Post('session/code/:code/join')
joinSessionByCode(
  @Param('code') code: string,
  @Authorized('id') userId: string,
) {
  return this.quizService.joinSessionByCode(code, userId);
}

  // START LOBBY SESSION
  @Authorization()
  @Post('session/:id/start')
  @UseGuards(AuthGuard)
  startSession(
    @Param('id') sessionId: string,
    @Authorized('id') userId: string,
  ) {
    return this.quizService.startSession(sessionId, userId);
  }

  // getCurrentLeaderboard
  @Public()
  @Authorization()
  @Get('session/:id/leaderboard')
  async getCurrentLeaderboard(@Param('id') sessionId: string) {
    return this.quizService.getLeaderboard(sessionId);
  }

  @Get('session/:id/scoreboard')
getScoreboard(@Param('id') sessionId: string) {
  return this.quizService.getScoreboard(sessionId);
}

  // @Authorization()
  // @Get('session/:id/leaderboard')
  // async getCurrentLeaderboard(
  //   @Param('id') sessionId: string,
  //   @Authorized('quiz/leaderboard') userId: string,
  // ): Promise<
  //   {
  //     rank: number;
  //     userId: string;
  //     name: string;
  //     picture: string | null;
  //     score: number;
  //   }[]
  // > {
  //   return this.quizService.getLeaderboard(sessionId);
  // }
}
