require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../src/db/pool');

const users = [
  { name: 'Admin User', email: 'admin@example.com', password: 'Admin@123', role: 'admin' },
  { name: 'Staff One',  email: 'staff1@example.com', password: 'Staff@123', role: 'staff' },
  { name: 'Staff Two',  email: 'staff2@example.com', password: 'Staff@123', role: 'staff' },
];

async function seed() {
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [u.name, u.email, hash, u.role]
    );
  }

  // A few sample inquiries so the list isn't empty on first run
  const { rows } = await pool.query(`SELECT id, email FROM users`);
  const id = (email) => rows.find((r) => r.email === email).id;

  const { rows: existing } = await pool.query('SELECT COUNT(*)::int AS c FROM inquiries');
  if (existing[0].c === 0) {
    await pool.query(
      `INSERT INTO inquiries (customer_name, contact_email, contact_phone, subject, description, status, created_by, assigned_to)
       VALUES
       ('Nimal Perera', 'nimal@mail.com', NULL, 'Order delay', 'My order has not arrived yet.', 'NEW', $1, $1),
       ('Kamala Silva', NULL, '0771234567', 'Refund request', 'I want a refund for a damaged item.', 'IN_PROGRESS', $1, $1),
       ('Ruwan Fernando', 'ruwan@mail.com', NULL, 'Wrong item', 'I received a different product.', 'NEW', $2, $2)`,
      [id('staff1@example.com'), id('staff2@example.com')]
    );
  }

  console.log('Seed completed');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});