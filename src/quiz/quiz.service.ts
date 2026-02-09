import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { SessionMode } from '@prisma/client';
import { LobbyModeService } from './mode/lobby.mode';
import { SoloModeService } from './mode/solo.mode';
import { CreateCategoryDto } from './dto/create-quiz.dto';

// @Injectable()
// export class QuizService {
//   constructor(
//     private readonly prisma: PrismaService,
//     private gateway: QuizGateway,
//   ) {}

//   /* ===================== CATEGORY ===================== */

//   async createCategory(dto: CreateCategoryDto) {
//     return this.prisma.quizCategory.create({
//       data: {
//         name: dto.name,
//         level: dto.level,
//       },
//     });
//   }

//   async findAllCategories() {
//     return this.prisma.quizCategory.findMany({
//       include: { _count: { select: { questions: true } } },
//     });
//   }

//   /* ===================== QUESTIONS ===================== */

//   async createQuestion(dto: CreateQuizDto) {
//     return this.prisma.quizQuestion.create({
//       data: {
//         question: dto.question,
//         options: dto.options,
//         answer: dto.answer,
//         timer: dto.timer,
//         level: dto.level,
//         maxPoints: dto.maxPoints,
//         categoryId: dto.categoryId,
//       },
//     });
//   }

//   async getQuestionsByCategory(query: GetQuestionsQueryDto) {
//     return this.prisma.quizQuestion.findMany({
//       where: {
//         categoryId: query.categoryId,
//         ...(query.level && { level: query.level }),
//       },
//     });
//   }

//   /* ===================== SESSION ===================== */

//   async createSession(userId: string, dto: CreateSessionDto) {
//     const { categoryId, level, questionCount, mode } = dto;

//     if (!questionCount || questionCount < 1) {
//       throw new BadRequestException('Минимум 1 суроо');
//     }

//     const questions = await this.prisma.quizQuestion.findMany({
//       where: { categoryId, level },
//     });

//     if (questions.length < questionCount) {
//       throw new BadRequestException('Суроолор жетишсиз');
//     }

//     const code =
//       mode === 'LOBBY'
//         ? Math.floor(100000 + Math.random() * 900000).toString()
//         : crypto.randomUUID().slice(0, 8).toUpperCase();

//     const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
//     const qrCode = `${baseUrl}/ru/codequiz/join/${code}`;

//     const session = await this.prisma.quizSession.create({
//       data: {
//         code,
//         qrCode,
//         categoryId,
//         level,
//         mode,
//         questionCount, // ✅ САКТАЛАТ
//         status: mode === 'SOLO' ? 'ACTIVE' : 'WAITING',
//         startedAt: mode === 'SOLO' ? new Date() : null,
//         participants: {
//           create: { userId, role: 'ADMIN' },
//         },
//       },
//     });

//     await this.prisma.quizSession.update({
//       where: { id: session.id },
//       data: {
//         status: mode === 'SOLO' ? QuizStatus.ACTIVE : QuizStatus.WAITING,
//         startedAt: mode === 'SOLO' ? new Date() : null,
//       },
//     });

//     if (mode === 'SOLO') {
//       await this.attachQuestions(session.id, questionCount);
//       await this.activateFirstQuestion(session.id);
//     }

//     return session;
//   }

//   async getCurrentQuestion(
//     sessionId: string,
//     userId: string,
//   ): Promise<CurrentQuestionResponse> {
//     const session = await this.prisma.quizSession.findUnique({
//       where: { id: sessionId },
//       include: {
//         questions: { include: { question: true } },
//         participants: true,
//       },
//     });

//     if (!session) {
//       throw new BadRequestException('Session табылган жок');
//     }

//     if (session.mode === 'LOBBY') {
//       return this.getLobbyCurrentQuestion(session, userId);
//     }

//     return this.getSoloCurrentQuestion(session, userId);
//   }

//   private async getSoloCurrentQuestion(
//     session: any,
//     userId: string,
//   ): Promise<SoloCurrentQuestionResponse> {
//     // 1️⃣ Participant
//     const participant = session.participants.find((p) => p.userId === userId);

//     const pointsTotal = participant?.score ?? 0;
//     const totalQuestions = session.questions.length;

//     // 2️⃣ Already answered questions
//     const answers = await this.prisma.quizAnswer.findMany({
//       where: {
//         sessionId: session.id,
//         userId,
//       },
//       select: {
//         questionId: true,
//       },
//     });

//     const answeredCount = answers.length;

//     // 3️⃣ Session finished
//     if (session.status === 'FINISHED') {
//       return {
//         status: 'FINISHED',
//         pointsTotal,
//         totalQuestions,
//         answeredCount,
//       };
//     }

//     // 4️⃣ Session not active yet
//     if (session.status !== 'ACTIVE') {
//       return {
//         status: 'WAITING',
//         totalQuestions,
//         answeredCount,
//       };
//     }

//     // 5️⃣ Find next unanswered question
//     const answeredIds = new Set(answers.map((a) => a.questionId));

//     const next = session.questions.find((q) => !answeredIds.has(q.questionId));

//     // 6️⃣ No more questions → finish
//     if (!next) {
//       await this.finishSession(session.id);

//       return {
//         status: 'FINISHED',
//         pointsTotal,
//         totalQuestions,
//         answeredCount,
//       };
//     }

//     // 7️⃣ ACTIVE question (frontend handles timer)
//     return {
//       status: 'ACTIVE',

//       questionId: next.questionId,
//       question: next.question.question,
//       options: next.question.options,

//       level: next.question.level,
//       timer: next.question.timer, // 👈 per-question timer
//       maxPoints: next.question.maxPoints,

//       answeredCount,
//       totalQuestions,
//       pointsTotal,

//       mode: session.mode,
//       participantCount: session.participants.length,
//     };
//   }

//   private async getLobbyCurrentQuestion(
//     session: any,
//     userId: string,
//   ): Promise<LobbyCurrentQuestionResponse> {
//     let current = session.questions.find((q) => q.isActive);
//     const participant = session.participants.find((p) => p.userId === userId);

//     if (!current) {
//       current = await this.activateFirstQuestion(session.id);
//       if (!current) {
//         throw new BadRequestException('Суроо табылган жок');
//       }
//     }

//     const deadline =
//       current.startedAt!.getTime() + current.question.timer * 1000;

//     if (session.status === 'WAITING') {
//       return {
//         status: 'WAITING',
//         answeredCount: 0,
//         totalQuestions: session.questionCount,
//       };
//     }

//     if (!current) {
//       current = await this.activateFirstQuestion(session.id);
//     }

//     if (session.status === 'FINISHED') {
//       const participant = session.participants.find((p) => p.userId === userId);
//       const pointsTotal = participant?.score ?? 0;

//       return {
//         status: 'FINISHED',
//         answeredCount: session.questionCount,
//         totalQuestions: session.questionCount,
//         pointsTotal,
//       };
//     }

//     const answered = await this.prisma.quizAnswer.findUnique({
//       where: {
//         userId_questionId_sessionId: {
//           userId,
//           questionId: current.questionId,
//           sessionId: session.id,
//         },
//       },
//     });

//     const answeredCount = await this.prisma.quizAnswer.count({
//       where: { sessionId: session.id, userId },
//     });

//     const pointsTotal = participant?.score ?? 0;

//     if (Date.now() > deadline) {
//       return {
//         status: 'EXPIRED',
//         questionId: current.questionId,
//         correctAnswer: current.question.answer,
//         answeredCount,
//         totalQuestions: session.questionCount,
//         pointsTotal,
//       };
//     }

//     return {
//       status: 'ACTIVE',
//       questionId: current.questionId,
//       question: current.question.question,
//       options: current.question.options,
//       level: current.question.level,
//       timer: current.question.timer,
//       expiresAt: deadline,
//       serverTime: Date.now(),
//       answeredCount,
//       totalQuestions: session.questionCount,
//       pointsTotal,
//       mode: session.mode,
//       participantCount: session.participants.length,
//       correctAnswer: current.question.answer,
//     };
//   }

//   async checkExpiredQuestions() {
//     const activeQuestions = await this.prisma.sessionQuestion.findMany({
//       where: { isActive: true },
//       include: { question: true },
//     });

//     for (const q of activeQuestions) {
//       if (!q.startedAt) continue;

//       const deadline = q.startedAt.getTime() + q.question.timer * 1000;

//       if (Date.now() > deadline) {
//         await this.finishCurrentAndAdvance(q.sessionId, q.id);
//       }
//     }
//   }

//   private async activateFirstQuestion(sessionId: string) {
//     return this.prisma.$transaction(async (tx) => {
//       const active = await tx.sessionQuestion.findFirst({
//         where: { sessionId, isActive: true },
//       });
//       if (active) return active;

//       const first = await tx.sessionQuestion.findFirst({
//         where: { sessionId, startedAt: null },
//         orderBy: { id: 'asc' },
//         include: { question: true },
//       });

//       if (!first) return null;

//       return tx.sessionQuestion.update({
//         where: { id: first.id },
//         data: { isActive: true, startedAt: new Date() },
//         include: { question: true },
//       });
//     });
//   }

//   private async finishCurrentAndAdvance(sessionId: string, currentId: string) {
//     const now = new Date();

//     await this.prisma.sessionQuestion.update({
//       where: { id: currentId },
//       data: { isActive: false },
//     });

//     const next = await this.prisma.sessionQuestion.findFirst({
//       where: {
//         sessionId,
//         startedAt: null,
//       },
//       orderBy: { id: 'asc' },
//     });

//     if (!next) {
//       this.gateway.quizFinished(sessionId);
//       await this.finishSession(sessionId);
//       return;
//     }

//     await this.prisma.sessionQuestion.update({
//       where: { id: next.id },
//       data: {
//         isActive: true,
//         startedAt: now,
//       },
//     });

//     this.gateway.questionEnded(sessionId);
//     this.gateway.questionStarted(sessionId);
//   }

//   async startSession(sessionId: string, userId: string) {
//     const participant = await this.prisma.quizParticipant.findUnique({
//       where: {
//         userId_sessionId: { userId, sessionId },
//       },
//     });

//     if (!participant || participant.role !== 'ADMIN') {
//       throw new BadRequestException('Тек админ баштай алат');
//     }

//     const session = await this.prisma.quizSession.findUnique({
//       where: { id: sessionId },
//     });

//     if (!session) {
//       throw new NotFoundException('Session табылган жок');
//     }

//     if (session.mode !== 'LOBBY') {
//       throw new BadRequestException('Solo session already started');
//     }

//     if (session.status !== 'WAITING') {
//       throw new BadRequestException('Session already started');
//     }

//     if (!session?.questionCount) {
//       throw new BadRequestException('questionCount жок');
//     }

//     await this.attachQuestions(sessionId, session.questionCount);
//     await this.activateFirstQuestion(sessionId);

//     return this.prisma.quizSession.update({
//       where: { id: sessionId },
//       data: {
//         status: 'ACTIVE',
//         startedAt: new Date(),
//       },
//     });
//   }

//   private async attachQuestions(sessionId: string, questionCount: number) {
//     const session = await this.prisma.quizSession.findUnique({
//       where: { id: sessionId },
//     });

//     if (!session) {
//       throw new NotFoundException('Session табылган жок');
//     }

//     const questions = await this.prisma.quizQuestion.findMany({
//       where: {
//         categoryId: session.categoryId,
//         level: session.level,
//       },
//     });

//     if (questions.length < questionCount) {
//       throw new BadRequestException('Суроолор жетишсиз');
//     }

//     const selected = shuffle(questions).slice(0, questionCount);

//     await this.prisma.sessionQuestion.createMany({
//       data: selected.map((q) => ({
//         sessionId,
//         questionId: q.id,
//         startedAt: null,
//       })),
//     });
//   }

//   getSessionQuestions(sessionId: string) {
//     return this.prisma.sessionQuestion.findMany({
//       where: { sessionId },
//       include: { question: true },
//     });
//   }

//   private async getSessionRaw(where: { id: string } | { code: string }) {
//     return this.prisma.quizSession.findUnique({
//       where,
//       include: {
//         participants: { include: { user: true } },
//         category: true,
//         questions: { include: { question: true } },
//       },
//     });
//   }

//   async getSessionById(id: string) {
//     const session = await this.getSessionRaw({ id });
//     if (!session) throw new NotFoundException('Session табылган жок');
//     return this.mapSessionResponse(session);
//   }

//   async joinSessionByCode(code: string, userId: string) {
//     const session = await this.prisma.quizSession.findUnique({
//       where: { code },
//       include: {
//         participants: { include: { user: true } },
//         category: true,
//         questions: true,
//       },
//     });

//     if (!session) throw new NotFoundException('Session табылган жок');

//     const alreadyJoined = session.participants.some((p) => p.userId === userId);

//     if (alreadyJoined) {
//       return this.mapSessionResponse(session);
//     }

//     const updated = await this.prisma.quizSession.update({
//       where: { id: session.id },
//       data: {
//         participants: {
//           create: {
//             userId,
//             role: 'USER',
//           },
//         },
//       },
//       include: {
//         participants: { include: { user: true } },
//         category: true,
//         questions: true,
//       },
//     });

//     return this.mapSessionResponse(updated);
//   }

//   private mapSessionResponse(session: any) {
//     const admin = session.participants.find((p) => p.role === 'ADMIN');
//     return {
//       id: session.id,
//       code: session.code,
//       qrCode: session.qrCode,
//       level: session.level,
//       status: session.status,
//       questionCount: session.questionCount ?? 0,
//       adminId: admin?.userId ?? null,
//       category: {
//         id: session.category.id,
//         name: session.category.name,
//       },
//       participants: session.participants.map((p) => ({
//         id: p.userId,
//         name: p.user.name,
//         picture: p.user.picture,
//         score: p.score,
//         role: p.role,
//       })),
//       userScores: session.participants.map((p) => ({
//         userId: p.userId,
//         pointsTotal: p.score,
//       })),
//       createdAt: session.createdAt,
//     };
//   }

//   async getSessionByCode(code: string) {
//     const session = await this.prisma.quizSession.findUnique({
//       where: { code },
//       include: {
//         participants: { include: { user: true } },
//         category: true,
//         questions: { include: { question: true } },
//       },
//     });

//     if (!session) {
//       throw new NotFoundException('Session табылган жок');
//     }

//     // Жаңы: колдонуучунун pointsTotal кошуу
//     const userScores = session.participants.map((p) => ({
//       userId: p.userId,
//       pointsTotal: p.score,
//     }));

//     return {
//       id: session.id,
//       code: session.code,
//       qrCode: session.qrCode,
//       category: {
//         id: session.category.id,
//         name: session.category.name,
//       },
//       level: session.level,
//       status: session.status,
//       participants: session.participants.map((p) => ({
//         id: p.userId,
//         name: p.user.name,
//         picture: p.user.picture,
//         score: p.score,
//         role: p.role,
//       })),
//       userScores,
//       questionCount: session.questions.length,
//       createdAt: session.createdAt,
//     };
//   }

//   /* ===================== ANSWERS ===================== */

//   private async getSessionQuestion(sessionId: string, questionId: string) {
//     const sessionQuestion = await this.prisma.sessionQuestion.findFirst({
//       where: {
//         sessionId,
//         questionId,
//       },
//       include: {
//         question: true,
//       },
//     });

//     if (!sessionQuestion) {
//       throw new BadRequestException('Суроо бул sessionга тиешелүү эмес');
//     }

//     if (!sessionQuestion.startedAt) {
//       throw new BadRequestException('Суроо баштала элек');
//     }

//     return sessionQuestion;
//   }

//   private ensureNotExpired(sessionQuestion: {
//     startedAt: Date | null;
//     question: { timer: number };
//   }) {
//     if (!sessionQuestion.startedAt) return;

//     const deadline =
//       sessionQuestion.startedAt.getTime() +
//       sessionQuestion.question.timer * 1000;

//     if (Date.now() > deadline) {
//       throw new BadRequestException('Суроонун убактысы бүттү');
//     }
//   }

//   private async answerExists(
//     userId: string,
//     sessionId: string,
//     questionId: string,
//   ) {
//     return this.prisma.quizAnswer.findUnique({
//       where: {
//         userId_questionId_sessionId: {
//           userId,
//           questionId,
//           sessionId,
//         },
//       },
//     });
//   }

//   private async addPoints(
//     tx: Prisma.TransactionClient,
//     userId: string,
//     session: { id: string },
//     answerId: string, // 👈 КОШУЛДУ
//     sessionQuestion: {
//       question: { maxPoints: number };
//     },
//   ) {
//     const value = sessionQuestion.question.maxPoints;

//     await tx.points.create({
//       data: {
//         userId,
//         sessionId: session.id,
//         answerId, // ✅ эми бар
//         value,
//         reason: 'Correct answer',
//       },
//     });

//     await tx.quizParticipant.update({
//       where: {
//         userId_sessionId: {
//           userId,
//           sessionId: session.id,
//         },
//       },
//       data: {
//         score: {
//           increment: value,
//         },
//       },
//     });
//   }

//   async submitAnswer(userId: string, dto: SubmitAnswerDto) {
//     const session = await this.prisma.quizSession.findUnique({
//       where: { id: dto.sessionId },
//       include: { participants: true },
//     });

//     if (!session) {
//       throw new BadRequestException('Session табылган жок');
//     }

//     if (session.mode === 'SOLO') {
//       return this.submitSoloAnswer(userId, dto, session);
//     }

//     return this.submitLobbyAnswer(userId, dto, session);
//   }

//   private async submitSoloAnswer(
//     userId: string,
//     dto: SubmitAnswerDto,
//     session: any,
//   ) {
//     const sessionQuestion = await this.getSessionQuestion(
//       dto.sessionId,
//       dto.questionId,
//     );

//     this.ensureNotExpired(sessionQuestion);

//     const exists = await this.answerExists(
//       userId,
//       dto.sessionId,
//       dto.questionId,
//     );

//     if (exists) {
//       return { isCorrect: exists.isCorrect };
//     }

//     const isCorrect = sessionQuestion.question.answer === dto.selected;

//     await this.prisma.$transaction(async (tx) => {
//       const createdAnswer = await tx.quizAnswer.create({
//         data: {
//           userId,
//           sessionId: dto.sessionId,
//           questionId: dto.questionId,
//           selected: dto.selected,
//           isCorrect,
//         },
//       });

//       // 2️⃣ туура болсо — балл кошуу
//       if (isCorrect) {
//         await this.addPoints(
//           tx,
//           userId,
//           session,
//           createdAnswer.id, // 👈 answerId ушул жерде берилет
//           sessionQuestion,
//         );
//       }
//     });

//     await this.prisma.sessionQuestion.update({
//       where: { id: sessionQuestion.id },
//       data: { isActive: false },
//     });

//     await this.activateFirstQuestion(dto.sessionId);

//     if (isCorrect) {
//       await this.updateUserLevel(userId);
//     }

//     return { isCorrect };
//   }

//   private async submitLobbyAnswer(
//     userId: string,
//     dto: SubmitAnswerDto,
//     session: any,
//   ) {
//     const sessionQuestion = await this.getSessionQuestion(
//       dto.sessionId,
//       dto.questionId,
//     );

//     this.ensureNotExpired(sessionQuestion);

//     const exists = await this.answerExists(
//       userId,
//       dto.sessionId,
//       dto.questionId,
//     );

//     if (exists) {
//       return { isCorrect: exists.isCorrect };
//     }

//     const isCorrect = sessionQuestion.question.answer === dto.selected;

//     await this.prisma.$transaction(async (tx) => {
//       // 1️⃣ жоопту сактайбыз
//       const createdAnswer = await tx.quizAnswer.create({
//         data: {
//           userId,
//           sessionId: dto.sessionId,
//           questionId: dto.questionId,
//           selected: dto.selected,
//           isCorrect,
//         },
//       });

//       // 2️⃣ туура болсо — балл беребиз
//       if (isCorrect) {
//         await this.addPoints(
//           tx,
//           userId,
//           session,
//           createdAnswer.id, // 👈 answerId ушул
//           sessionQuestion,
//         );
//       }

//       // 3️⃣ канча адам жооп берди?
//       const answered = await tx.quizAnswer.count({
//         where: {
//           sessionId: dto.sessionId,
//           questionId: dto.questionId,
//         },
//       });

//       // 4️⃣ баары жооп берсе — кийинки суроого өтөбүз
//       if (answered === session.participants.length) {
//         await this.finishCurrentAndAdvance(dto.sessionId, sessionQuestion.id);
//       }
//     });

//     if (isCorrect) {
//       await this.updateUserLevel(userId);
//     }

//     return { isCorrect };
//   }

//   async finishSession(sessionId: string) {
//     const session = await this.prisma.quizSession.update({
//       where: { id: sessionId },
//       data: {
//         status: 'FINISHED',
//         endedAt: new Date(),
//       },
//       select: {
//         id: true,
//         mode: true,
//       },
//     });

//     return session;
//   }

//   private getLevelByPoints(points: number) {
//     if (points >= 2500) return 'ELITE';
//     if (points >= 1000) return 'PLATINUM';
//     if (points >= 750) return 'GOLD';
//     if (points >= 250) return 'SILVER';
//     return 'BRONZE';
//   }
//   private async updateUserLevel(userId: string) {
//     const total = await this.prisma.points.aggregate({
//       where: { userId },
//       _sum: { value: true },
//     });

//     const totalPoints = total._sum.value ?? 0;

//     const newLevel = this.getLevelByPoints(totalPoints);

//     await this.prisma.user.update({
//       where: { id: userId },
//       data: { level: newLevel as any },
//     });
//   }
//   async getScoreboard(sessionId: string) {
//     const participants = await this.prisma.quizParticipant.findMany({
//       where: { sessionId },
//       include: {
//         user: {
//           select: { id: true, name: true, picture: true },
//         },
//       },
//       orderBy: { score: 'desc' },
//     });

//     return participants.map((p) => ({
//       userId: p.user.id,
//       name: p.user.name,
//       picture: p.user.picture,
//       score: p.score,
//     }));
//   }

//   async countAnswersForQuestion(sessionId: string, questionId: string) {
//     return this.prisma.quizAnswer.count({
//       where: { sessionId, questionId },
//     });
//   }

//   async advanceToNextQuestion(sessionId: string) {
//     const sessionQuestions = await this.prisma.sessionQuestion.findMany({
//       where: { sessionId },
//       orderBy: { startedAt: 'asc' },
//     });

//     const nextQuestion = sessionQuestions.find((q) => !q.startedAt);

//     if (!nextQuestion) {
//       // суроолор бүттү
//       await this.finishSession(sessionId);
//       return;
//     }

//     await this.prisma.sessionQuestion.update({
//       where: { id: nextQuestion.id },
//       data: { startedAt: new Date() },
//     });
//   }

//   /* ===================== LEADERBOARD ===================== */

//   async getLeaderboard(sessionId: string) {
//     const session = await this.prisma.quizSession.findUnique({
//       where: { id: sessionId },
//     });

//     if (!session) {
//       throw new NotFoundException('Сессия табылган жок');
//     }

//     const leaderboard = await this.prisma.quizParticipant.findMany({
//       where: { sessionId },
//       include: {
//         user: {
//           select: { id: true, name: true, picture: true },
//         },
//       },
//       orderBy: { score: 'desc' },
//     });

//     return leaderboard.map((p, index) => ({
//       rank: index + 1,
//       userId: p.user.id,
//       name: p.user.name,
//       picture: p.user.picture,
//       score: p.score,
//     }));
//   }
// }

@Injectable()
export class QuizService {
  constructor(
    private prisma: PrismaService,
    private soloMode: SoloModeService,
    private lobbyMode: LobbyModeService,
  ) {}

  //   /* ===================== CATEGORY ===================== */

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

  private getMode(mode: SessionMode) {
    return mode === 'SOLO' ? this.soloMode : this.lobbyMode;
  }

  async submitAnswer(userId: string, dto: SubmitAnswerDto) {
    const session = await this.prisma.quizSession.findUnique({
      where: { id: dto.sessionId },
      include: { participants: true },
    });

    if (!session) throw new BadRequestException('Session табылган жок');

    return this.getMode(session.mode).submitAnswer(userId, dto, session);
  }

  async getCurrentQuestion(sessionId: string, userId: string) {
    const session = await this.prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: {
        questions: { include: { question: true } },
        participants: true,
      },
    });

    if (!session) throw new BadRequestException('Session жок');

    return this.getMode(session.mode).getCurrentQuestion(session, userId);
  }

  async getSessionWithRelations(sessionId: string) {
    const session = await this.prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: {
        participants: true,
        questions: {
          orderBy: { id: 'asc' },
          include: { question: true },
        },
      },
    });

    if (!session) throw new NotFoundException('Session табылган жок');

    return session;
  }

  async activateFirstQuestion(sessionId: string) {
    // Биринчиден, эгер ACTIVE суроо бар болсо кайтар
    const active = await this.prisma.sessionQuestion.findFirst({
      where: { sessionId, isActive: true },
    });
    if (active) return active;

    // Эң биринчи старт боло элек суроону ал
    const first = await this.prisma.sessionQuestion.findFirst({
      where: { sessionId, startedAt: null },
      orderBy: { id: 'asc' }, // же sequence талаа болсо sequence боюнча
      include: { question: true },
    });

    if (!first) return null;

    return this.prisma.sessionQuestion.update({
      where: { id: first.id },
      data: { isActive: true, startedAt: new Date() },
      include: { question: true },
    });
  }

  async startSession(sessionId: string) {
    const session = await this.prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: { participants: true },
    });

    if (!session) throw new NotFoundException('Session табылган жок');

    if (session.status !== 'WAITING') {
      throw new BadRequestException('Session already started');
    }

    // SOLO болсо автомат эле active кылып коёбуз
    if (session.mode === 'SOLO') {
      await this.activateFirstQuestion(session.id);
    }

    return this.prisma.quizSession.update({
      where: { id: session.id },
      data: { status: 'ACTIVE', startedAt: new Date() },
    });
  }

  async getResults(sessionId: string) {
    const participants = await this.prisma.quizParticipant.findMany({
      where: { sessionId },
      include: {
        user: { select: { id: true, name: true, picture: true } },
      },
      orderBy: { score: 'desc' },
    });

    return participants.map((p, index) => ({
      rank: index + 1,
      userId: p.user.id,
      name: p.user.name,
      picture: p.user.picture,
      score: p.score,
    }));
  }
}
