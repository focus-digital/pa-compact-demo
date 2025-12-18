import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { closeTestApp, createTestApp, login } from '../helpers/test-app.js';
import { prisma } from '../test-setup.js';
import { AuthService } from '@/service/authService.js';
import { UserRole } from '@/domain/enums.js';

describe('Member state routes', () => {
  let app: FastifyInstance;
  let stateAdminCookie: string;

  beforeAll(async () => {
    const { app: testApp } = await createTestApp();
    app = testApp;
    await prisma.memberState.deleteMany();
    const states = await prisma.memberState.createMany({
      data: [
        { code: 'CO', name: 'Colorado' },
        { code: 'MA', name: 'Massachusetts' },
        { code: 'ZZ', name: 'Inactive', isActive: false },
      ],
    });

    const passwordHash = await AuthService.hashPassword('Password123!');
    await prisma.user.create({
      data: {
        email: 'state-admin@example.com',
        firstName: 'State',
        lastName: 'Admin',
        role: UserRole.STATE_ADMIN,
        passwordHash,
      },
    });

    stateAdminCookie = await login(app, 'state-admin@example.com', 'Password123!');
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('returns active member states sorted by name', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/states',
      headers: { cookie: stateAdminCookie },
    });

    expect(response.statusCode).toBe(200);
    const states = response.json() as Array<{ code: string; isActive: boolean }>;
    expect(states).toHaveLength(2);
    expect(states[0]?.code).toBe('CO');
    expect(states[1]?.code).toBe('MA');
    expect(states.every((state) => state.isActive)).toBe(true);
  });
});
