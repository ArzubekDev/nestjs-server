import { IsString, IsUUID, IsNumber } from 'class-validator';

export class SubmitAnswerDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  questionId: string;

  @IsNumber()
  value: number;

  @IsString()
  selected: string;
}
