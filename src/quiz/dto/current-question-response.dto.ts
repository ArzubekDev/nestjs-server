export type CurrentQuestionResponse =
  | {
      status: 'WAITING';
      answeredCount: number;
      totalQuestions: number;
    }
  | {
      status: 'ACTIVE';
      questionId: string;
      question: string;
      options: string[];
      level: number;
      timer: number;
      expiresAt: number;
      serverTime: number;
      answeredCount: number;
      totalQuestions: number;
      pointsTotal: number;
      mode: "SOLO" | "LOBBY";
      participantCount: number;
      correctAnswer: string;
    }
  | {
      status: 'EXPIRED';
      answeredCount: number;
      totalQuestions: number;
      pointsTotal: number;
    }
  | {
      status: 'FINISHED';
      pointsTotal: number;
      totalQuestions: number;
      answeredCount: number;
    };