import { IsEnum, IsMongoId } from 'class-validator';
import { PROJECT_ROLES, ProjectRole } from '@projectflow/shared';

export class AddProjectMemberDto {
  @IsMongoId()
  userId: string;

  @IsEnum(PROJECT_ROLES)
  role: ProjectRole;
}
