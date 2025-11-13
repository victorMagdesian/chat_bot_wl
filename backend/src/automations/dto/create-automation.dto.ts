import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsInt, Min, MaxLength } from 'class-validator';

export class CreateAutomationDto {
  @IsString()
  @IsNotEmpty()
  botId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  trigger: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  response: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}
