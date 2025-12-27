/*
  Warnings:

  - The values [MYTHIC] on the enum `Level` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `createdAt` on the `points` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `points` table. All the data in the column will be lost.
  - You are about to drop the `token` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `answer_id` to the `points` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `points` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QuestionLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- AlterEnum
BEGIN;
CREATE TYPE "Level_new" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'ELITE');
ALTER TABLE "public"."users" ALTER COLUMN "level" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "level" TYPE "Level_new" USING ("level"::text::"Level_new");
ALTER TYPE "Level" RENAME TO "Level_old";
ALTER TYPE "Level_new" RENAME TO "Level";
DROP TYPE "public"."Level_old";
ALTER TABLE "users" ALTER COLUMN "level" SET DEFAULT 'BRONZE';
COMMIT;

-- DropForeignKey
ALTER TABLE "points" DROP CONSTRAINT "points_userId_fkey";

-- DropForeignKey
ALTER TABLE "token" DROP CONSTRAINT "token_user_id_fkey";

-- AlterTable
ALTER TABLE "points" DROP COLUMN "createdAt",
DROP COLUMN "userId",
ADD COLUMN     "answer_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" TEXT NOT NULL,
ALTER COLUMN "value" DROP DEFAULT;

-- DropTable
DROP TABLE "token";

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "quiz_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "answer" TEXT NOT NULL,
    "level" "QuestionLevel" NOT NULL,
    "timer" INTEGER NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAnswer" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "selected" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_session_token_key" ON "tokens"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_category_name_key" ON "quiz_category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "QuizAnswer_user_id_question_id_key" ON "QuizAnswer"("user_id", "question_id");

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points" ADD CONSTRAINT "points_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points" ADD CONSTRAINT "points_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "QuizAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "quiz_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
