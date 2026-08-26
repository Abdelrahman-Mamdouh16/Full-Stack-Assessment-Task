import type { INestApplication } from '@nestjs/common';
import type { Connection } from 'mongoose';
import request from 'supertest';
import { OrganizationRole, ProjectRole } from '@projectflow/shared';
import { createTestApp, resetDatabase } from './utils/test-app';
import {
  addOrganizationMember,
  addProjectMember,
  authHeader,
  createOrganization,
  createProject,
  registerUser,
  type TestUser,
} from './utils/fixtures';

describe('Projects', () => {
  let app: INestApplication;
  let connection: Connection;

  let owner: TestUser;
  let member: TestUser;
  let outsider: TestUser;
  let engineeringProjectId: string;

  beforeAll(async () => {
    ({ app, connection } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(connection);

    owner = await registerUser(app, 'Ammar Yaser', 'ammar@example.com');
    member = await registerUser(app, 'Magd Ali', 'magd@example.com');
    outsider = await registerUser(app, 'Outside User', 'outside@example.com');

    const organizationId = await createOrganization(
      connection,
      'Acme Software',
      'acme-software',
      owner.id,
    );
    await addOrganizationMember(connection, organizationId, owner.id, OrganizationRole.OWNER);
    await addOrganizationMember(connection, organizationId, member.id, OrganizationRole.MEMBER);

    engineeringProjectId = await createProject(
      connection,
      organizationId,
      'Internal Platform',
      'ENG',
      owner.id,
    );
    await createProject(connection, organizationId, 'Customer Portal', 'WEB', owner.id);

    await addProjectMember(connection, engineeringProjectId, member.id, ProjectRole.MEMBER);
  });

  it('returns every project in the organization to an owner', async () => {
    const response = await request(app.getHttpServer())
      .get('/projects')
      .set('Authorization', authHeader(owner))
      .expect(200);

    expect(response.body.map((project: { key: string }) => project.key).sort()).toEqual([
      'ENG',
      'WEB',
    ]);
  });

  it('returns only the projects a plain member belongs to', async () => {
    const response = await request(app.getHttpServer())
      .get('/projects')
      .set('Authorization', authHeader(member))
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({ key: 'ENG', memberCount: 1 });
  });

  it('returns nothing to a user outside the organization', async () => {
    const response = await request(app.getHttpServer())
      .get('/projects')
      .set('Authorization', authHeader(outsider))
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it('refuses to open a project the user has no access to', async () => {
    const response = await request(app.getHttpServer())
      .get(`/projects/${engineeringProjectId}`)
      .set('Authorization', authHeader(outsider))
      .expect(403);

    expect(response.body).toMatchObject({
      statusCode: 403,
      message: 'You do not have access to this project',
    });
  });

  it('lists project members for someone with access', async () => {
    const response = await request(app.getHttpServer())
      .get(`/projects/${engineeringProjectId}/members`)
      .set('Authorization', authHeader(owner))
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].user).toMatchObject({ email: 'magd@example.com' });
  });
});
