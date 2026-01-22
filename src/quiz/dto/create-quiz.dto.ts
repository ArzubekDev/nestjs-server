import { QuestionLevel } from '@prisma/client';
import { IsString, IsInt, IsArray, IsObject, IsEnum, IsUUID, IsIn, IsOptional, isEnum } from 'class-validator';

export class CreateQuizDto {
  @IsString()
  question: string;

  @IsObject()
  options: Record<string, string>;

  @IsString()
  answer: string;

  @IsInt()
  timer: number;

  @IsInt()
  maxPoints: number

  @IsUUID()
  categoryId: string;

  @IsEnum(QuestionLevel)
  level: QuestionLevel;
}

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsEnum(QuestionLevel)
  level: QuestionLevel;
}

export class GetQuestionsQueryDto {
  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsEnum(QuestionLevel)
  level?: QuestionLevel;
}