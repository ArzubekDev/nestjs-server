import { IsUUID, IsEnum, IsInt, Min, Max, IsNumber, IsString } from 'class-validator';
import { QuestionLevel, SessionMode } from '@prisma/client';

export class CreateSessionDto {
  @IsUUID()
  categoryId: string;

  @IsEnum(QuestionLevel)
  level: QuestionLevel;

  @IsNumber()
  questionCount: number;

  @IsEnum(SessionMode)
  mode: SessionMode;

}

export class StartSessionDto {
  @IsNumber()
  questionCount: number;
}

export class CreateSoloSessionDto {
  @IsUUID()
  categoryId: string;

  @IsEnum(QuestionLevel)
  level: QuestionLevel;

  
  @IsNumber()
  questionCount: number;
}