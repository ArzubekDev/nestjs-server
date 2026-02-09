export type LobbyCurrentQuestionResponse =
  | {
      status: 'WAITING';
      answeredCount: number;
      totalQuestions: number;
    }
  | {
      status: 'ACTIVE';
      mode: 'LOBBY';

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

      participantCount: number;
      correctAnswer: string;
    }
  | {
      status: 'EXPIRED';
      questionId: string;
      correctAnswer: string;
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

    export type SoloCurrentQuestionResponse =
  | {
      status: 'WAITING';
      answeredCount: number;
      totalQuestions: number;
    }
  | {
      status: 'ACTIVE';
      mode: 'SOLO';

      questionId: string;
      question: string;
      options: Record<string, string>;

      level: 'EASY' | 'MEDIUM' | 'HARD';
      timer: number;
      maxPoints: number;

      answeredCount: number;
      totalQuestions: number;
      pointsTotal: number;

      participantCount: number;
    }
  | {
      status: 'FINISHED';
      pointsTotal: number;
      totalQuestions: number;
      answeredCount: number;
    };

    export type CurrentQuestionResponse =
  | LobbyCurrentQuestionResponse
  | SoloCurrentQuestionResponse;
