import { QuestionLevel } from '@prisma/client';
import { IsString, IsInt, IsArray, IsObject, IsEnum } from 'class-validator';

export class CreateQuizDto {
  @IsString()
  question: string;

  @IsObject()
  options: Record<string, string>;

  @IsString()
  answer: string;

  @IsInt()
  timer: number;

  @IsString()
  categoryId: string;

  @IsEnum(QuestionLevel)
  level: QuestionLevel;
}
export class CreateCategoryDto {
  @IsString()
  name: string;
}
