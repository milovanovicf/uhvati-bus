import request from 'supertest';
import { testServer } from '@/app/api/lib/testServer';
import * as loginHandler from '@/app/api/login/route';
import * as registerHandler from '@/app/api/register/route';
import * as logoutHandler from '@/app/api/logout/route';

jest.mock('@/app/utils/db', () => ({
  prisma: {
    company: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn(),
    set: jest.fn(),
  }),
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import { prisma } from '@/app/utils/db';
import bcrypt from 'bcrypt';

const mockCompany = {
  id: 1,
  name: 'Test Prevoz',
  email: 'test@prevoz.com',
  password: '$2b$10$hashedpassword',
};

// ─── Login ────────────────────────────────────────────────────────────────────

describe('POST /api/login', () => {
  const server = testServer(loginHandler);

  beforeEach(() => jest.clearAllMocks());

  it('returns 200 on valid credentials', async () => {
    (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const res = await request(server)
      .post('/')
      .send({ email: mockCompany.email, password: 'correctpassword' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 401 on wrong password', async () => {
    (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const res = await request(server)
      .post('/')
      .send({ email: mockCompany.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('returns 401 when company does not exist', async () => {
    (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(server)
      .post('/')
      .send({ email: 'nobody@test.com', password: 'anypassword' });

    expect(res.status).toBe(401);
  });
});

// ─── Register ─────────────────────────────────────────────────────────────────

describe('POST /api/register', () => {
  const server = testServer(registerHandler);

  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with company data on success', async () => {
    (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedpassword');
    (prisma.company.create as jest.Mock).mockResolvedValue(mockCompany);

    const res = await request(server).post('/').send({
      name: 'Test Prevoz',
      email: 'test@prevoz.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.company.email).toBe(mockCompany.email);
    expect(res.body.company.id).toBe(mockCompany.id);
  });

  it('returns 409 when email is already registered', async () => {
    (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);

    const res = await request(server).post('/').send({
      name: 'Test Prevoz',
      email: mockCompany.email,
      password: 'password123',
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already in use/i);
  });

  it('does not expose password in the response', async () => {
    (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedpassword');
    (prisma.company.create as jest.Mock).mockResolvedValue(mockCompany);

    const res = await request(server).post('/').send({
      name: 'Test Prevoz',
      email: 'test@prevoz.com',
      password: 'password123',
    });

    expect(res.body.company.password).toBeUndefined();
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────

describe('POST /api/logout', () => {
  const server = testServer(logoutHandler);

  it('returns 200 with success message', async () => {
    const res = await request(server).post('/');

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });
});
