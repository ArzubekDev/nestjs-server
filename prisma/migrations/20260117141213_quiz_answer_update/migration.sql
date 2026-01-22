-- AlterTable
ALTER TABLE "QuizAnswer" ALTER COLUMN "selected" DROP NOT NULL,
ALTER COLUMN "isCorrect" SET DEFAULT false;
