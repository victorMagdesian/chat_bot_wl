import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class GetScheduledMessagesQueryDto {
  @IsOptional()
  @IsString()
  botId?: string;

  @IsOptional()
  @IsEnum(['pending', 'sent', 'failed'])
  status?: 'pending' | 'sent' | 'failed';

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
