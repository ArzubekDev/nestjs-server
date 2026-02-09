import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SubmitAnswerDto } from '../dto/submit-answer.dto';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class SoloModeService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  async getCurrentQuestion(session: any, userId: string) {
    const participant = session.participants.find((p) => p.userId === userId);
    const pointsTotal = participant?.score ?? 0;
    const totalQuestions = session.questions.length;

    const answers = await this.prisma.quizAnswer.findMany({
      where: { sessionId: session.id, userId },
      select: { questionId: true },
    });

    const answeredIds = new Set(answers.map((a) => a.questionId));
    const answeredCount = answers.length;

    if (session.status === 'FINISHED') {
      return { status: 'FINISHED', pointsTotal, totalQuestions, answeredCount };
    }

    if (session.status !== 'ACTIVE') {
      return { status: 'WAITING', totalQuestions, answeredCount };
    }

    const next = session.questions.find((q) => !answeredIds.has(q.questionId));

    if (!next) {
      await this.finishSession(session.id);
      return { status: 'FINISHED', pointsTotal, totalQuestions, answeredCount };
    }

    return {
      status: 'ACTIVE',
      questionId: next.questionId,
      question: next.question.question,
      options: next.question.options,
      timer: next.question.timer,
      level: next.question.level,
      maxPoints: next.question.maxPoints,
      answeredCount,
      totalQuestions,
      pointsTotal,
      mode: session.mode,
      participantCount: session.participants.length,
    };
  }

  /* ================= ANSWER ================= */

  async submitAnswer(userId: string, dto: SubmitAnswerDto, session: any) {
    const sessionQuestion = await this.getSessionQuestion(
      dto.sessionId,
      dto.questionId,
    );

    this.ensureNotExpired(sessionQuestion);

    const exists = await this.prisma.quizAnswer.findUnique({
      where: {
        userId_questionId_sessionId: {
          userId,
          questionId: dto.questionId,
          sessionId: dto.sessionId,
        },
      },
    });

    if (exists) return { isCorrect: exists.isCorrect };

    const isCorrect = sessionQuestion.question.answer === dto.selected;

    await this.prisma.$transaction(async (tx) => {
      const answer = await tx.quizAnswer.create({
        data: {
          userId,
          sessionId: dto.sessionId,
          questionId: dto.questionId,
          selected: dto.selected,
          isCorrect,
        },
      });

      if (isCorrect) {
        await this.gamification.handleCorrectAnswer(tx, {
          userId,
          sessionId: session.id,
          answerId: answer.id,
          maxPoints: sessionQuestion.question.maxPoints,
        });
      }
    });

    await this.activateNextQuestion(dto.sessionId, sessionQuestion.id);

    return { isCorrect };
  }

  private async activateNextQuestion(sessionId: string, currentId: string) {
    await this.prisma.sessionQuestion.update({
      where: { id: currentId },
      data: { isActive: false },
    });

    const next = await this.prisma.sessionQuestion.findFirst({
      where: { sessionId, startedAt: null },
      orderBy: { id: 'asc' },
    });

    if (!next) {
      await this.finishSession(sessionId);
      return;
    }

    await this.prisma.sessionQuestion.update({
      where: { id: next.id },
      data: { isActive: true, startedAt: new Date() },
    });
  }

  private async finishSession(sessionId: string) {
    await this.prisma.quizSession.update({
      where: { id: sessionId },
      data: { status: 'FINISHED', endedAt: new Date() },
    });
  }

  private async getSessionQuestion(sessionId: string, questionId: string) {
    const sq = await this.prisma.sessionQuestion.findFirst({
      where: { sessionId, questionId },
      include: { question: true },
    });

    if (!sq || !sq.startedAt) throw new BadRequestException('Суроо актив эмес');

    return sq;
  }

  private ensureNotExpired(sq: any) {
    const deadline = sq.startedAt.getTime() + sq.question.timer * 1000;

    if (Date.now() > deadline) throw new BadRequestException('Убакыт бүттү');
  }
}
