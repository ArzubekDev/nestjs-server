-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('ADMIN', 'USER');

-- AlterTable
ALTER TABLE "QuizParticipant" ADD COLUMN     "role" "ParticipantRole" NOT NULL DEFAULT 'USER';
