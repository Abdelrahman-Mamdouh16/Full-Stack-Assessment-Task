import { IsMongoId, IsOptional, IsString, Length, Matches } from 'class-validator';
import { PROJECT_KEY_PATTERN } from '@projectflow/shared';

export class CreateProjectDto {
  @IsMongoId()
  organizationId: string;

  @IsString()
  @Length(2, 80)
  name: string;

  @IsString()
  @Matches(PROJECT_KEY_PATTERN, {
    message: 'key must be 2-10 uppercase letters or digits and start with a letter',
  })
  key: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}
