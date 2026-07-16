import { IsEmail, IsOptional, IsString, IsUrl, Length, Matches } from 'class-validator';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@projectflow/shared';

export class RegisterDto {
  @IsString()
  @Length(2, 80)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'password must contain an uppercase letter, a lowercase letter and a digit',
  })
  password: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  avatarUrl?: string;
}
