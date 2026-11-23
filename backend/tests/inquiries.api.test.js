const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');

// Logs in and returns an agent that keeps the auth cookie
async function loginAs(email, password) {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email, password }).expect(200);
  return agent;
}

const createdIds = [];

afterAll(async () => {
  if (createdIds.length) {
    await pool.query('DELETE FROM inquiries WHERE id = ANY($1)', [createdIds]);
  }
  await pool.end();
});

describe('Authentication', () => {
  test('rejects requests without a valid session (401)', async () => {
    const res = await request(app).get('/api/inquiries');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });
});

describe('Validation', () => {
  test('API rejects an inquiry with missing fields, even if the UI is bypassed (400)', async () => {
    const staff1 = await loginAs('staff1@example.com', 'Staff@123');
    const res = await staff1
      .post('/api/inquiries')
      .send({ customerName: '', contactEmail: '', subject: 'Hi' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const fields = res.body.error.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['customerName', 'description']));
  });
});

describe('Access rule', () => {
  test("staff cannot open another staff member's inquiry via direct link (404), admin can", async () => {
    const { rows } = await pool.query(
      `SELECT i.id FROM inquiries i
       JOIN users u ON u.id = i.created_by
       WHERE u.email = 'staff2@example.com'
       LIMIT 1`
    );
    const staff2InquiryId = rows[0].id;

    const staff1 = await loginAs('staff1@example.com', 'Staff@123');
    const denied = await staff1.get(`/api/inquiries/${staff2InquiryId}`);
    expect(denied.status).toBe(404);

    const admin = await loginAs('admin@example.com', 'Admin@123');
    const allowed = await admin.get(`/api/inquiries/${staff2InquiryId}`);
    expect(allowed.status).toBe(200);
  });
});

describe('Stale updates (optimistic locking)', () => {
  test('second update using an old version is rejected (409)', async () => {
    const staff1 = await loginAs('staff1@example.com', 'Staff@123');

    const created = await staff1.post('/api/inquiries').send({
      customerName: 'Test Customer',
      contactEmail: 'test@example.com',
      subject: `Stale test ${Date.now()}`, // unique, so the duplicate check doesn't trigger
      description: 'Created by automated test',
    });
    expect(created.status).toBe(201);
    const { id, version } = created.body.inquiry;
    createdIds.push(id);

    // "Tab A" updates successfully
    const first = await staff1
      .patch(`/api/inquiries/${id}/status`)
      .send({ status: 'IN_PROGRESS', version });
    expect(first.status).toBe(200);
    expect(first.body.inquiry.version).toBe(version + 1);

    // "Tab B" still has the old version
    const second = await staff1
      .patch(`/api/inquiries/${id}/status`)
      .send({ status: 'RESOLVED', version });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('STALE_INQUIRY');
  });
});