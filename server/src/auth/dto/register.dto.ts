import {
  IsEmail,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';
export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8) // For example
  @IsStrongPassword() //TODO : what are the constraints
  password: string;
}
