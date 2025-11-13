import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  chatId: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsEnum(['bot', 'user'])
  sender: 'bot' | 'user';

  @IsString()
  instagramId?: string;
}
