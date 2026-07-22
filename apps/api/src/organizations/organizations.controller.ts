import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { toObjectId } from '../common/utils/object-id';
import { OrganizationsService, type OrganizationWithRole } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  findMine(@CurrentUser('id') userId: string): Promise<OrganizationWithRole[]> {
    return this.organizationsService.findForUser(toObjectId(userId, 'user id'));
  }
}
