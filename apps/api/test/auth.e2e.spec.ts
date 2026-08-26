import type { INestApplication } from '@nestjs/common';
import type { Connection } from 'mongoose';
import request from 'supertest';
import { createTestApp, resetDatabase } from './utils/test-app';
import { registerUser, TEST_PASSWORD } from './utils/fixtures';

describe('Auth', () => {
  let app: INestApplication;
  let connection: Connection;

  beforeAll(async () => {
    ({ app, connection } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(connection);
  });

  it('signs a user in with valid credentials', async () => {
    await registerUser(app, 'Ammar Yaser', 'ammar@example.com');

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ammar@example.com', password: TEST_PASSWORD })
      .expect(200);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      name: 'Ammar Yaser',
      email: 'ammar@example.com',
    });
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('rejects a login with the wrong password', async () => {
    await registerUser(app, 'Ammar Yaser', 'ammar@example.com');

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ammar@example.com', password: 'WrongPassword1' })
      .expect(401);

    expect(response.body).toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
    });
  });

  it('returns the current user for an authenticated request', async () => {
    const user = await registerUser(app, 'Sarah Ahmed', 'sarah@example.com');

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200);

    expect(response.body).toMatchObject({ email: 'sarah@example.com', organizations: [] });
  });

  it('rejects an unauthenticated request', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });
});
