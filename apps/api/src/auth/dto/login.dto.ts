import { IsEmail, IsString, Length } from 'class-validator';
import { PASSWORD_MAX_LENGTH } from '@projectflow/shared';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(1, PASSWORD_MAX_LENGTH)
  password: string;
}
