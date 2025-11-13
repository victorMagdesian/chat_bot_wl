import { IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MessageDto {
  @IsString()
  mid: string;

  @IsString()
  text: string;
}

export class SenderDto {
  @IsString()
  id: string;
}

export class RecipientDto {
  @IsString()
  id: string;
}

export class MessagingDto {
  @ValidateNested()
  @Type(() => SenderDto)
  sender: SenderDto;

  @ValidateNested()
  @Type(() => RecipientDto)
  recipient: RecipientDto;

  @IsNumber()
  timestamp: number;

  @ValidateNested()
  @Type(() => MessageDto)
  message: MessageDto;
}

export class EntryDto {
  @IsString()
  id: string;

  @IsNumber()
  time: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessagingDto)
  messaging: MessagingDto[];
}

export class WebhookPayloadDto {
  @IsString()
  object: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntryDto)
  entry: EntryDto[];
}
