import type { INestApplication } from '@nestjs/common';
import type { Connection } from 'mongoose';
import request from 'supertest';
import { OrganizationRole, ProjectRole, TaskPriority } from '@projectflow/shared';
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

describe('Task Assignment (Part 8)', () => {
  let app: INestApplication;
  let connection: Connection;

  let owner: TestUser;
  let manager: TestUser;
  let member1: TestUser;
  let member2: TestUser;
  let outsider: TestUser;

  let projectId: string;
  let taskId: string;

  beforeAll(async () => {
    ({ app, connection } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(connection);

    owner = await registerUser(app, 'Ammar Owner', 'ammar@example.com');
    manager = await registerUser(app, 'Ahmed Manager', 'ahmed@example.com');
    member1 = await registerUser(app, 'Magd Member1', 'magd@example.com');
    member2 = await registerUser(app, 'Sarah Member2', 'sarah@example.com');
    outsider = await registerUser(app, 'Outside User', 'outside@example.com');

    const organizationId = await createOrganization(
      connection,
      'Acme Corp',
      'acme-corp',
      owner.id,
    );
    await addOrganizationMember(connection, organizationId, owner.id, OrganizationRole.OWNER);
    await addOrganizationMember(connection, organizationId, manager.id, OrganizationRole.MEMBER);
    await addOrganizationMember(connection, organizationId, member1.id, OrganizationRole.MEMBER);
    await addOrganizationMember(connection, organizationId, member2.id, OrganizationRole.MEMBER);

    projectId = await createProject(
      connection,
      organizationId,
      'Platform',
      'PLAT',
      owner.id,
    );

    // Add manager and member1 to project; member2 is also added to project
    await addProjectMember(connection, projectId, manager.id, ProjectRole.PROJECT_MANAGER);
    await addProjectMember(connection, projectId, member1.id, ProjectRole.MEMBER);
    await addProjectMember(connection, projectId, member2.id, ProjectRole.MEMBER);

    // Create a task to test assignment on
    const taskRes = await request(app.getHttpServer())
      .post(`/projects/${projectId}/tasks`)
      .set('Authorization', authHeader(member1))
      .send({
        title: 'Task for assignment test',
        priority: TaskPriority.MEDIUM,
      })
      .expect(201);

    taskId = taskRes.body.id;
  });

  // 1. Regular MEMBER self-assigns -> 200, assignee updated
  it('allows a regular MEMBER to self-assign a task', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/tasks/${taskId}/assignee`)
      .set('Authorization', authHeader(member1))
      .send({ assigneeId: member1.id })
      .expect(200);

    expect(res.body.assignee).toMatchObject({
      id: member1.id,
      email: member1.email,
    });
  });

  // 2. Regular MEMBER assigns someone else -> 403 Forbidden
  it('forbids a regular MEMBER from assigning someone else', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/tasks/${taskId}/assignee`)
      .set('Authorization', authHeader(member1))
      .send({ assigneeId: member2.id })
      .expect(403);

    expect(res.body.message).toMatch(/Members can only assign tasks to themselves/i);
  });

  // 3. PROJECT_MANAGER assigns another project member -> 200, assignee updated
  it('allows PROJECT_MANAGER to assign another project member', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/tasks/${taskId}/assignee`)
      .set('Authorization', authHeader(manager))
      .send({ assigneeId: member1.id })
      .expect(200);

    expect(res.body.assignee).toMatchObject({
      id: member1.id,
      email: member1.email,
    });
  });

  // 4. Elevated org role (OWNER) assigns a project member -> 200, assignee updated
  it('allows organization OWNER to assign a project member', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/tasks/${taskId}/assignee`)
      .set('Authorization', authHeader(owner))
      .send({ assigneeId: member2.id })
      .expect(200);

    expect(res.body.assignee).toMatchObject({
      id: member2.id,
      email: member2.email,
    });
  });

  // 5. Assign to a user who is NOT a project member -> 400 Bad Request
  it('rejects assigning to a user who is not a project member', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/tasks/${taskId}/assignee`)
      .set('Authorization', authHeader(manager))
      .send({ assigneeId: outsider.id })
      .expect(400);

    expect(res.body.message).toMatch(/Assignee must be a member of this project/i);
  });

  // 6. Assign to a non-existent userId -> 404 Not Found
  it('rejects assigning to a non-existent user with 404', async () => {
    const nonExistentId = '64b000000000000000000000';
    const res = await request(app.getHttpServer())
      .patch(`/tasks/${taskId}/assignee`)
      .set('Authorization', authHeader(manager))
      .send({ assigneeId: nonExistentId })
      .expect(404);

    expect(res.body.message).toMatch(/User not found/i);
  });

  // 7. Unassignment (assigneeId: null) -> 200, assignee is null
  // 7. Unassignment (assigneeId: null)
  it('allows unassigning a task by manager or the current assignee, but forbids other members', async () => {
    // 1. Assign to member1
    await request(app.getHttpServer())
      .patch(`/tasks/${taskId}/assignee`)
      .set('Authorization', authHeader(manager))
      .send({ assigneeId: member1.id })
      .expect(200);

    // 2. Member2 tries to unassign member1 -> 403 Forbidden
    await request(app.getHttpServer())
      .patch(`/tasks/${taskId}/assignee`)
      .set('Authorization', authHeader(member2))
      .send({ assigneeId: null })
      .expect(403);

    // 3. Member1 unassigns themselves -> 200 OK
    const selfUnassignRes = await request(app.getHttpServer())
      .patch(`/tasks/${taskId}/assignee`)
      .set('Authorization', authHeader(member1))
      .send({ assigneeId: null })
      .expect(200);
    expect(selfUnassignRes.body.assignee).toBeNull();

    // 4. Assign again and verify manager can unassign
    await request(app.getHttpServer())
      .patch(`/tasks/${taskId}/assignee`)
      .set('Authorization', authHeader(manager))
      .send({ assigneeId: member1.id })
      .expect(200);

    const managerUnassignRes = await request(app.getHttpServer())
      .patch(`/tasks/${taskId}/assignee`)
      .set('Authorization', authHeader(manager))
      .send({ assigneeId: null })
      .expect(200);
    expect(managerUnassignRes.body.assignee).toBeNull();
  });

  // 8. User without view access to the project tries to assign -> 403 Forbidden
  it('forbids an outsider without project access from making assignments', async () => {
    await request(app.getHttpServer())
      .patch(`/tasks/${taskId}/assignee`)
      .set('Authorization', authHeader(outsider))
      .send({ assigneeId: member1.id })
      .expect(403);
  });
});
