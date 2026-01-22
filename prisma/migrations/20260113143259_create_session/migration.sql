/*
  Warnings:

  - Added the required column `mode` to the `QuizSession` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('SOLO', 'LOBBY');

-- AlterTable
ALTER TABLE "QuizSession" ADD COLUMN     "mode" "SessionMode" NOT NULL;
