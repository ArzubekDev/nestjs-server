import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { CreateCategoryDto, CreateQuizDto } from './dto/create-quiz.dto';

@Injectable()
export class QuizService {
  constructor(private readonly prisma: PrismaService) {}

  async submitAnswer(dto: SubmitAnswerDto) {
    // 1. Тандалган суроону текшерүү
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id: dto.questionId },
    });

    if (!question) {
      throw new NotFoundException('Суроо табылган жок');
    }

    // 2. Колдонуучунун жоопун сактоо (QuizAnswer таблицага)
    const answer = await this.prisma.quizAnswer.create({
      data: {
        userId: dto.userId,
        questionId: dto.questionId,
        selected: dto.selected,
        isCorrect: question.answer === dto.selected,
      },
    });

    // 3. Points кошуу (фронтендтен келген value менен)
    if (dto.value > 0) {
      await this.prisma.points.create({
        data: {
          userId: dto.userId,
          value: dto.value,
          reason: 'Quiz Answer',
          answerId: answer.id,
        },
      });
    }

    return { answer, pointsAdded: dto.value };
  }

  async createQuestion(dto: CreateQuizDto) {
  return this.prisma.quizQuestion.create({
    data: {
      question: dto.question,
      options: dto.options,
      answer: dto.answer,
      timer: dto.timer,
      level: dto.level,
      categoryId: dto.categoryId,
    },
  });
}

async getQuestion(){
  return this.prisma.quizQuestion.findMany()
}

  // Category түзүү
  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.quizCategory.create({
      data: {
        name: dto.name,
      },
    });
  }

  // Бардык категорияларды алуу
  async findAllCategories() {
    return this.prisma.quizCategory.findMany();
  }

}
