import { IsString, IsOptional, IsBoolean, IsInt, Min, MaxLength } from 'class-validator';

export class UpdateAutomationDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  trigger?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  response?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}
