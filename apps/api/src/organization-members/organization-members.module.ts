import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationMembersService } from './organization-members.service';
import { OrganizationMember, OrganizationMemberSchema } from './schemas/organization-member.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OrganizationMember.name, schema: OrganizationMemberSchema },
    ]),
  ],
  providers: [OrganizationMembersService],
  exports: [OrganizationMembersService, MongooseModule],
})
export class OrganizationMembersModule {}
