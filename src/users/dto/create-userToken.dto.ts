import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

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

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;
}
