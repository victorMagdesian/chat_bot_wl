import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateScheduledMessageDto {
  @IsNotEmpty()
  @IsString()
  botId: string;

  @IsNotEmpty()
  @IsString()
  recipient: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsDateString()
  scheduledAt: string;
}
