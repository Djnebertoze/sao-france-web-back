import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateUserTokenDto {
  @IsNotEmpty()
  @IsString()
  accessToken: string;

  @IsNotEmpty()
  @IsNumber()
  issuedAt: number;

  @IsNotEmpty()
  @IsNumber()
  expiresAt: number;

  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName: string;
}
