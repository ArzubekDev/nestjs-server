import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import {
  CreateCategoryDto,
  CreateQuizDto,
  GetQuestionsQueryDto,
} from './dto/create-quiz.dto';
import { CreateSessionDto, StartSessionDto } from './dto/create-session.dto';
import { shuffle } from 'src/utils/shuffle';
import { QuizStatus } from '@prisma/client';

@Injectable()
export class QuizService {
  constructor(private readonly prisma: PrismaService) {}

  /* ===================== CATEGORY ===================== */

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.quizCategory.create({
      data: {
        name: dto.name,
        level: dto.level,
      },
    });
  }

  async findAllCategories() {
    return this.prisma.quizCategory.findMany({
      include: { _count: { select: { questions: true } } },
    });
  }

  /* ===================== QUESTIONS ===================== */

  async createQuestion(dto: CreateQuizDto) {
    return this.prisma.quizQuestion.create({
      data: {
        question: dto.question,
        options: dto.options,
        answer: dto.answer,
        timer: dto.timer,
        level: dto.level,
        maxPoints: dto.maxPoints,
        categoryId: dto.categoryId,
      },
    });
  }

  async getQuestionsByCategory(query: GetQuestionsQueryDto) {
    return this.prisma.quizQuestion.findMany({
      where: {
        categoryId: query.categoryId,
        ...(query.level && { level: query.level }),
      },
    });
  }

  /* ===================== SESSION ===================== */

  async createSession(userId: string, dto: CreateSessionDto) {
    const { categoryId, level, questionCount, mode } = dto;

    if (!questionCount || questionCount < 1) {
      throw new BadRequestException('Минимум 1 суроо');
    }

    const questions = await this.prisma.quizQuestion.findMany({
      where: { categoryId, level },
    });

    if (questions.length < questionCount) {
      throw new BadRequestException('Суроолор жетишсиз');
    }

    const code =
      mode === 'LOBBY'
        ? Math.floor(100000 + Math.random() * 900000).toString()
        : crypto.randomUUID().slice(0, 8).toUpperCase();

    const qrCode = `quiz:${code}`;

    const session = await this.prisma.quizSession.create({
      data: {
        code,
        qrCode,
        categoryId,
        level,
        mode,
        questionCount, // ✅ САКТАЛАТ
        status: mode === 'SOLO' ? 'ACTIVE' : 'WAITING',
        startedAt: mode === 'SOLO' ? new Date() : null,
        participants: {
          create: { userId, role: 'ADMIN' },
        },
      },
    });

    await this.prisma.quizSession.update({
      where: { id: session.id },
      data: {
        status: mode === 'SOLO' ? QuizStatus.ACTIVE : QuizStatus.WAITING,
        startedAt: mode === 'SOLO' ? new Date() : null,
      },
    });

    if (mode === 'SOLO') {
      await this.attachQuestions(session.id, questionCount);
    }

    return session;
  }

  async getCurrentQuestion(sessionId: string, userId: string) {
    const session = await this.prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: {
        questions: {
          include: { question: true },
          orderBy: { startedAt: 'asc' },
        },
        participants: true,
      },
    });

    if (!session) {
      throw new BadRequestException('Session табылган жок');
    }

    const participant = session.participants.find((p) => p.userId === userId);

    const pointsTotal = participant?.score ?? 0;

    const totalQuestions = session.questions.length;

    const answers = await this.prisma.quizAnswer.findMany({
      where: { sessionId, userId },
      select: { questionId: true },
    });

    const answeredCount = answers.length;

    // ✅ 1. FINISHED — ЭҢ АЛГАЧКЫ RETURN
    if (session.status === 'FINISHED') {
      return {
        finished: true,
        pointsTotal,
        totalQuestions,
        answeredCount,
        mode: session.mode,
      };
    }

    // ✅ 2. ACTIVE эмес болсо — ката
    if (session.status !== 'ACTIVE') {
      throw new BadRequestException('Session активдүү эмес');
    }

    const answeredIds = new Set(answers.map((a) => a.questionId));

    const next = session.questions.find((q) => !answeredIds.has(q.questionId));

    // ✅ 3. Суроо калбаса — FINISH
    if (!next) {
      await this.finishSession(sessionId);

      return {
        finished: true,
        pointsTotal,
        totalQuestions,
        answeredCount,
        mode: session.mode,
      };
    }

    if (!next.startedAt) {
      const now = new Date();

      await this.prisma.sessionQuestion.update({
        where: { id: next.id },
        data: { startedAt: now },
      });

      next.startedAt = now;
    }

    const deadline = next.startedAt.getTime() + next.question.timer * 1000;

    // ⏱ timeout
    if (Date.now() > deadline) {
      await this.prisma.quizAnswer.upsert({
        where: {
          userId_questionId_sessionId: {
            userId,
            questionId: next.questionId,
            sessionId,
          },
        },
        update: {},
        create: {
          userId,
          sessionId,
          questionId: next.questionId,
          selected: null,
          isCorrect: false,
        },
      });

      return {
        expired: true,
        pointsTotal,
        totalQuestions,
        answeredCount: answeredCount + 1,
        mode: session.mode,
      };
    }

    return {
      questionId: next.questionId,
      question: next.question.question,
      options: next.question.options,
      level: next.question.level,
      correctAnswer: next.question.answer,
      timer: next.question.timer,
      mode: session.mode,
      pointsTotal,
      totalQuestions,
      answeredCount,
      expiresAt: deadline,
      serverTime: Date.now(),
      finished: false,
      participantCount: session.participants.length,
    };
  }

  async startSession(sessionId: string, userId: string) {
    const participant = await this.prisma.quizParticipant.findUnique({
      where: {
        userId_sessionId: { userId, sessionId },
      },
    });

    if (!participant || participant.role !== 'ADMIN') {
      throw new BadRequestException('Тек админ баштай алат');
    }

    const session = await this.prisma.quizSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session табылган жок');
    }

    if (session.mode !== 'LOBBY') {
      throw new BadRequestException('Solo session already started');
    }

    if (session.status !== 'WAITING') {
      throw new BadRequestException('Session already started');
    }

    if (!session?.questionCount) {
      throw new BadRequestException('questionCount жок');
    }

    await this.attachQuestions(sessionId, session.questionCount);

    return this.prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        status: 'ACTIVE',
        startedAt: new Date(),
      },
    });
  }

  private async attachQuestions(sessionId: string, questionCount: number) {
    const session = await this.prisma.quizSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session табылган жок');
    }

    const questions = await this.prisma.quizQuestion.findMany({
      where: {
        categoryId: session.categoryId,
        level: session.level,
      },
    });

    if (questions.length < questionCount) {
      throw new BadRequestException('Суроолор жетишсиз');
    }

    const selected = shuffle(questions).slice(0, questionCount);

    await this.prisma.sessionQuestion.createMany({
      data: selected.map((q) => ({
        sessionId,
        questionId: q.id,
        startedAt: null,
      })),
    });
  }

  getSessionQuestions(sessionId: string) {
    return this.prisma.sessionQuestion.findMany({
      where: { sessionId },
      include: { question: true },
    });
  }

  private async getSessionRaw(where: { id: string } | { code: string }) {
    return this.prisma.quizSession.findUnique({
      where,
      include: {
        participants: { include: { user: true } },
        category: true,
        questions: { include: { question: true } },
      },
    });
  }

  async getSessionById(id: string) {
    const session = await this.getSessionRaw({ id });
    if (!session) throw new NotFoundException('Session табылган жок');
    return this.mapSessionResponse(session);
  }

  async joinSessionByCode(code: string, userId: string) {
    const session = await this.prisma.quizSession.findUnique({
      where: { code },
      include: {
        participants: { include: { user: true } },
        category: true,
        questions: true,
      },
    });

    if (!session) throw new NotFoundException('Session табылган жок');

    const alreadyJoined = session.participants.some((p) => p.userId === userId);

    if (alreadyJoined) {
      return this.mapSessionResponse(session);
    }

    const updated = await this.prisma.quizSession.update({
      where: { id: session.id },
      data: {
        participants: {
          create: {
            userId,
            role: 'USER',
          },
        },
      },
      include: {
        participants: { include: { user: true } },
        category: true,
        questions: true,
      },
    });

    return this.mapSessionResponse(updated);
  }

  private mapSessionResponse(session: any) {
    const admin = session.participants.find((p) => p.role === 'ADMIN');
    return {
      id: session.id,
      code: session.code,
      qrCode: session.qrCode,
      level: session.level,
      status: session.status,
      questionCount: session.questionCount ?? 0,
      adminId: admin?.userId ?? null,
      category: {
        id: session.category.id,
        name: session.category.name,
      },
      participants: session.participants.map((p) => ({
        id: p.userId,
        name: p.user.name,
        picture: p.user.picture,
        score: p.score,
        role: p.role,
      })),
      userScores: session.participants.map((p) => ({
        userId: p.userId,
        pointsTotal: p.score,
      })),
      createdAt: session.createdAt,
    };
  }

  async getSessionByCode(code: string) {
    const session = await this.prisma.quizSession.findUnique({
      where: { code },
      include: {
        participants: { include: { user: true } },
        category: true,
        questions: { include: { question: true } },
      },
    });

    if (!session) {
      throw new NotFoundException('Session табылган жок');
    }

    // Жаңы: колдонуучунун pointsTotal кошуу
    const userScores = session.participants.map((p) => ({
      userId: p.userId,
      pointsTotal: p.score,
    }));

    return {
      id: session.id,
      code: session.code,
      qrCode: session.qrCode,
      category: {
        id: session.category.id,
        name: session.category.name,
      },
      level: session.level,
      status: session.status,
      participants: session.participants.map((p) => ({
        id: p.userId,
        name: p.user.name,
        picture: p.user.picture,
        score: p.score,
        role: p.role,
      })),
      userScores,
      questionCount: session.questions.length,
      createdAt: session.createdAt,
    };
  }

  /* ===================== ANSWERS ===================== */

  async submitAnswer(userId: string, dto: SubmitAnswerDto) {
    const { sessionId, questionId, selected } = dto;

    const sessionQuestion = await this.prisma.sessionQuestion.findFirst({
      where: { sessionId, questionId },
      include: { question: true },
    });

    if (!sessionQuestion) {
      throw new BadRequestException('Суроо sessionда жок');
    }

    if (!sessionQuestion.startedAt) {
      throw new BadRequestException('startedAt жок');
    }

    const deadline =
      sessionQuestion.startedAt.getTime() +
      sessionQuestion.question.timer * 1000;

    // ⏱ таймаут
    if (Date.now() > deadline) {
      return { expired: true };
    }

    const isCorrect = sessionQuestion.question.answer === selected;

    const exists = await this.prisma.quizAnswer.findUnique({
      where: {
        userId_questionId_sessionId: {
          userId,
          questionId,
          sessionId,
        },
      },
    });

    if (exists) {
      return { isCorrect: exists.isCorrect };
    }

    return this.prisma.$transaction(async (tx) => {
      const answer = await tx.quizAnswer.create({
        data: {
          userId,
          sessionId,
          questionId,
          selected,
          isCorrect,
        },
      });

      if (isCorrect) {
        await tx.points.create({
          data: {
            userId,
            sessionId,
            answerId: answer.id,
            value: sessionQuestion.question.maxPoints,
            reason: 'Correct answer in SOLO session',
          },
        });

        await tx.quizParticipant.update({
          where: {
            userId_sessionId: {
              userId,
              sessionId,
            },
          },
          data: {
            score: {
              increment: sessionQuestion.question.maxPoints,
            },
          },
        });
        await this.updateUserLevel(userId);
      }

      return { isCorrect };
    });
  }

  async finishSession(sessionId: string) {
    const session = await this.prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        status: 'FINISHED',
        endedAt: new Date(),
      },
      select: {
        id: true,
        mode: true,
      },
    });

    return session;
  }

  private getLevelByPoints(points: number) {
    if (points >= 2500) return 'ELITE';
    if (points >= 1000) return 'PLATINUM';
    if (points >= 750) return 'GOLD';
    if (points >= 250) return 'SILVER';
    return 'BRONZE';
  }
  private async updateUserLevel(userId: string) {
    const total = await this.prisma.points.aggregate({
      where: { userId },
      _sum: { value: true },
    });

    const totalPoints = total._sum.value ?? 0;

    const newLevel = this.getLevelByPoints(totalPoints);

    await this.prisma.user.update({
      where: { id: userId },
      data: { level: newLevel as any },
    });
  }
  async getScoreboard(sessionId: string) {
    const participants = await this.prisma.quizParticipant.findMany({
      where: { sessionId },
      include: {
        user: {
          select: { id: true, name: true, picture: true },
        },
      },
      orderBy: { score: 'desc' },
    });

    return participants.map((p) => ({
      userId: p.user.id,
      name: p.user.name,
      picture: p.user.picture,
      score: p.score,
    }));
  }

  /* ===================== LEADERBOARD ===================== */

  async getLeaderboard(sessionId: string) {
    const session = await this.prisma.quizSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Сессия табылган жок');
    }

    const leaderboard = await this.prisma.quizParticipant.findMany({
      where: { sessionId },
      include: {
        user: {
          select: { id: true, name: true, picture: true },
        },
      },
      orderBy: { score: 'desc' },
    });

    return leaderboard.map((p, index) => ({
      rank: index + 1,
      userId: p.user.id,
      name: p.user.name,
      picture: p.user.picture,
      score: p.score,
    }));
  }
}
