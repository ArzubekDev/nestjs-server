import { Controller, Post, Body, Get } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { CreateCategoryDto, CreateQuizDto } from './dto/create-quiz.dto';

@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('submit')
  async submitAnswer(@Body() dto: SubmitAnswerDto) {
    return this.quizService.submitAnswer(dto);
  }

  @Post('question')
  async createQuestion(@Body() dto: CreateQuizDto) {
    return this.quizService.createQuestion(dto);
  }

  @Get('question')
  async getQuestion() {
    return this.quizService.getQuestion();
  }

  @Post('category')
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.quizService.createCategory(dto);
  }

  @Get('categories')
  async getCategories() {
    return this.quizService.findAllCategories();
  }
}
