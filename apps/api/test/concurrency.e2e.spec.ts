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

describe('Task Numbering Concurrency', () => {
  let app: INestApplication;
  let connection: Connection;

  let owner: TestUser;
  let member: TestUser;
  let projectId: string;

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

    const organizationId = await createOrganization(
      connection,
      'Acme Software',
      'acme-software',
      owner.id,
    );
    await addOrganizationMember(connection, organizationId, owner.id, OrganizationRole.OWNER);
    await addOrganizationMember(connection, organizationId, member.id, OrganizationRole.MEMBER);

    projectId = await createProject(
      connection,
      organizationId,
      'Internal Platform',
      'ENG',
      owner.id,
    );
    await addProjectMember(connection, projectId, member.id, ProjectRole.MEMBER);
  });

  it('generates strictly unique sequential task numbers and keys under concurrent creation', async () => {
    const TASK_COUNT = 10;
    const taskTitles = Array.from(
      { length: TASK_COUNT },
      (_, index) => `Concurrent Task ${index + 1}`,
    );

    // Launch concurrent task creation requests simultaneously
    const responses = await Promise.all(
      taskTitles.map((title) =>
        request(app.getHttpServer())
          .post(`/projects/${projectId}/tasks`)
          .set('Authorization', authHeader(member))
          .send({
            title,
            priority: TaskPriority.MEDIUM,
          }),
      ),
    );

    // All requests should succeed with 201 Created
    for (const res of responses) {
      expect(res.status).toBe(201);
    }

    const numbers = responses.map((res) => res.body.number);
    const keys = responses.map((res) => res.body.key);

    // Ensure all task numbers are unique
    const uniqueNumbers = new Set(numbers);
    expect(uniqueNumbers.size).toBe(TASK_COUNT);

    // Ensure all keys are unique
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(TASK_COUNT);

    // Sort numbers and verify they form an exact sequence 1..TASK_COUNT
    const sortedNumbers = [...numbers].sort((a, b) => a - b);
    const expectedSequence = Array.from({ length: TASK_COUNT }, (_, index) => index + 1);
    expect(sortedNumbers).toEqual(expectedSequence);

    // Verify all keys match ENG-<number>
    for (const num of expectedSequence) {
      expect(uniqueKeys.has(`ENG-${num}`)).toBe(true);
    }
  });
});
