import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { SessionFlowService } from "../flow/session-flow.service";
import { GamificationService } from "../gamification/gamification.service";
import { SubmitAnswerDto } from "../dto/submit-answer.dto";

@Injectable()
export class LobbyModeService {
  constructor(
    private prisma: PrismaService,
    private flow: SessionFlowService,
    private gamification: GamificationService,
  ) {}

  /* =====================================================
     🎯 CURRENT QUESTION (REALTIME LOBBY)
  ===================================================== */

  async getCurrentQuestion(session: any, userId: string) {
    if (session.status === 'WAITING') {
      return {
        status: 'WAITING',
        totalQuestions: session.questionCount,
        answeredCount: 0,
      };
    }

    if (session.status === 'FINISHED') {
      const participant = session.participants.find(p => p.userId === userId);
      return {
        status: 'FINISHED',
        totalQuestions: session.questionCount,
        answeredCount: session.questionCount,
        pointsTotal: participant?.score ?? 0,
      };
    }

    const current = session.questions.find(q => q.isActive);
    if (!current) return { status: 'WAITING' };

    const deadline =
      current.startedAt!.getTime() + current.question.timer * 1000;

    const participant = session.participants.find(p => p.userId === userId);
    const answered = await this.prisma.quizAnswer.findUnique({
      where: {
        userId_questionId_sessionId: {
          userId,
          questionId: current.questionId,
          sessionId: session.id,
        },
      },
    });

    const answeredCount = await this.prisma.quizAnswer.count({
      where: { sessionId: session.id, userId },
    });

    if (Date.now() > deadline) {
      return {
        status: 'EXPIRED',
        questionId: current.questionId,
        correctAnswer: current.question.answer,
        totalQuestions: session.questionCount,
        answeredCount,
        pointsTotal: participant?.score ?? 0,
      };
    }

    return {
      status: 'ACTIVE',
      questionId: current.questionId,
      question: current.question.question,
      options: current.question.options,
      level: current.question.level,
      timer: current.question.timer,
      expiresAt: deadline,
      serverTime: Date.now(),
      totalQuestions: session.questionCount,
      answeredCount,
      pointsTotal: participant?.score ?? 0,
      participantCount: session.participants.length,
      mode: session.mode,
      hasAnswered: !!answered,
    };
  }

  /* =====================================================
     📝 SUBMIT ANSWER
  ===================================================== */

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

    await this.prisma.$transaction(async tx => {
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

      const answeredCount = await tx.quizAnswer.count({
        where: {
          sessionId: dto.sessionId,
          questionId: dto.questionId,
        },
      });

      // 🎯 Эгер баары жооп берсе → кийинки суроо
      if (answeredCount === session.participants.length) {
        await this.flow.advance(dto.sessionId, sessionQuestion.id);
      }
    });

    return { isCorrect };
  }

  /* =====================================================
     🧠 HELPERS
  ===================================================== */

  private async getSessionQuestion(sessionId: string, questionId: string) {
    const sq = await this.prisma.sessionQuestion.findFirst({
      where: { sessionId, questionId, isActive: true },
      include: { question: true },
    });

    if (!sq) throw new BadRequestException('Суроо актив эмес');

    return sq;
  }

  private ensureNotExpired(sq: any) {
    const deadline =
      sq.startedAt.getTime() + sq.question.timer * 1000;

    if (Date.now() > deadline)
      throw new BadRequestException('Убакыт бүттү');
  }
}