import { IsString, IsUUID, IsNumber, IsBoolean } from 'class-validator';

export class SubmitAnswerDto {

  @IsUUID()
  questionId: string;

  @IsUUID()
  sessionId: string

  @IsString()
  selected: string;
}
