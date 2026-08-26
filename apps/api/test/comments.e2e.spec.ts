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
  createTask,
  registerUser,
  type TestUser,
} from './utils/fixtures';

describe('Comments', () => {
  let app: INestApplication;
  let connection: Connection;

  let owner: TestUser;
  let member: TestUser;
  let outsider: TestUser;
  let taskId: string;

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

    const projectId = await createProject(
      connection,
      organizationId,
      'Internal Platform',
      'ENG',
      owner.id,
    );
    await addProjectMember(connection, projectId, member.id, ProjectRole.MEMBER);

    taskId = await createTask(
      connection,
      projectId,
      'ENG',
      1,
      'Add project member search',
      owner.id,
    );
  });

  it('lets a project member comment on a task', async () => {
    const response = await request(app.getHttpServer())
      .post(`/tasks/${taskId}/comments`)
      .set('Authorization', authHeader(member))
      .send({ content: 'Picking this up today.' })
      .expect(201);

    expect(response.body).toMatchObject({ content: 'Picking this up today.' });
    expect(response.body.author).toMatchObject({ email: 'magd@example.com' });
  });

  it('returns the comments on a task in creation order', async () => {
    await request(app.getHttpServer())
      .post(`/tasks/${taskId}/comments`)
      .set('Authorization', authHeader(member))
      .send({ content: 'First' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/tasks/${taskId}/comments`)
      .set('Authorization', authHeader(owner))
      .send({ content: 'Second' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/tasks/${taskId}/comments`)
      .set('Authorization', authHeader(member))
      .expect(200);

    expect(response.body.total).toBe(2);
    expect(response.body.items.map((comment: { content: string }) => comment.content)).toEqual([
      'First',
      'Second',
    ]);
  });

  it('refuses to read comments for a user outside the project', async () => {
    await request(app.getHttpServer())
      .get(`/tasks/${taskId}/comments`)
      .set('Authorization', authHeader(outsider))
      .expect(403);
  });

  it('refuses to add a comment for a user outside the project', async () => {
    await request(app.getHttpServer())
      .post(`/tasks/${taskId}/comments`)
      .set('Authorization', authHeader(outsider))
      .send({ content: 'I should not be able to post this.' })
      .expect(403);
  });

  it('rejects an empty comment', async () => {
    await request(app.getHttpServer())
      .post(`/tasks/${taskId}/comments`)
      .set('Authorization', authHeader(member))
      .send({ content: '' })
      .expect(400);
  });
});
