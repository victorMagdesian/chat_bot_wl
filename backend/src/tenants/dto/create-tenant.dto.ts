import { IsString, IsNotEmpty, IsOptional, IsHexColor, Matches, MinLength, MaxLength } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Domain must contain only lowercase letters, numbers, and hyphens',
  })
  @MinLength(3)
  @MaxLength(63)
  domain: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsHexColor()
  primaryColor?: string;
}
