import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { QuizGateway } from "../quiz.gateway";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class SessionFlowService {
  constructor(
    private prisma: PrismaService,
    private gateway: QuizGateway,
  ) {}

  async activateNext(sessionId: string) {
    const next = await this.prisma.sessionQuestion.findFirst({
      where: { sessionId, startedAt: null },
      orderBy: { id: 'asc' },
      include: { question: true },
    });

    if (!next) {
      await this.finishSession(sessionId);
      return null;
    }

    const activated = await this.prisma.sessionQuestion.update({
      where: { id: next.id },
      data: { isActive: true, startedAt: new Date() },
      include: { question: true },
    });

    this.gateway.questionStarted(sessionId);

    return activated;
  }

  async closeQuestion(sessionQuestionId: string, sessionId: string) {
    await this.prisma.sessionQuestion.update({
      where: { id: sessionQuestionId },
      data: { isActive: false, finishedAt: new Date() },
    });

    this.gateway.questionEnded(sessionId);
  }

  async advance(sessionId: string, currentQuestionId: string) {
    await this.closeQuestion(currentQuestionId, sessionId);
    return this.activateNext(sessionId);
  }


  @Cron('*/1 * * * * *')
  async handleExpiredQuestions() {
    const active = await this.prisma.sessionQuestion.findMany({
      where: { isActive: true },
      include: { question: true },
    });

    const now = Date.now();

    for (const q of active) {
      if (!q.startedAt) continue;

      const deadline = q.startedAt.getTime() + q.question.timer * 1000;

      if (now > deadline) {
        await this.advance(q.sessionId, q.id);
      }
    }
  }


  async finishSession(sessionId: string) {
    await this.prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        status: 'FINISHED',
        endedAt: new Date(),
      },
    });

    this.gateway.quizFinished(sessionId);
  }
}