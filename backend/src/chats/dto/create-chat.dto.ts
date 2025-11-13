import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateChatDto {
  @IsNotEmpty()
  @IsString()
  botId: string;

  @IsNotEmpty()
  @IsString()
  instagramUserId: string;

  @IsOptional()
  @IsString()
  instagramUsername?: string;
}
