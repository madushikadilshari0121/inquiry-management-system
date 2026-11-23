const pool = require('../db/pool');
const AppError = require('../utils/AppError');

// ---------- Business rule: status transitions ----------
const ALLOWED_TRANSITIONS = {
  NEW: ['IN_PROGRESS'],
  IN_PROGRESS: ['NEW', 'RESOLVED'],
  RESOLVED: ['IN_PROGRESS'], // reopen
};

function assertValidTransition(from, to) {
  const allowed = ALLOWED_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    throw new AppError(
      422,
      'INVALID_STATUS_TRANSITION',
      `Cannot change status from ${from} to ${to}`,
      { allowed }
    );
  }
}

// ---------- Business rule: access ----------
// Admins see everything. Staff see only inquiries they created or are assigned to.
function accessFilter(user, params) {
  if (user.role === 'admin') return 'TRUE';
  params.push(user.id);
  const p = `$${params.length}`;
  return `(i.created_by = ${p} OR i.assigned_to = ${p})`;
}

const SELECT_INQUIRY = `
  SELECT i.*, u.name AS created_by_name
  FROM inquiries i
  JOIN users u ON u.id = i.created_by`;

// DB rows use snake_case; the API returns camelCase
function toDto(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    subject: row.subject,
    description: row.description,
    status: row.status,
    createdBy: { id: row.created_by, name: row.created_by_name },
    assignedTo: row.assigned_to,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listInquiries(user, { status, search }) {
  const params = [];
  const conditions = [accessFilter(user, params)];

  if (status) {
    params.push(status);
    conditions.push(`i.status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    const p = `$${params.length}`;
    conditions.push(
      `(i.customer_name ILIKE ${p} OR i.subject ILIKE ${p} OR i.contact_email ILIKE ${p} OR i.contact_phone ILIKE ${p})`
    );
  }

  const { rows } = await pool.query(
    `${SELECT_INQUIRY} WHERE ${conditions.join(' AND ')} ORDER BY i.updated_at DESC LIMIT 200`,
    params
  );
  return rows.map(toDto);
}

async function getInquiry(user, id) {
  const params = [id];
  const { rows } = await pool.query(
    `${SELECT_INQUIRY} WHERE i.id = $1 AND ${accessFilter(user, params)}`,
    params
  );
  if (rows.length === 0) {
    // Same response for "doesn't exist" and "not yours", so we don't leak which IDs exist
    throw new AppError(404, 'INQUIRY_NOT_FOUND', 'Inquiry not found');
  }
  return toDto(rows[0]);
}

async function createInquiry(user, data) {
  const { customerName, subject, description } = data;
  const contactEmail = data.contactEmail ?? null;
  const contactPhone = data.contactPhone ?? null;

  // Duplicate policy: same user + same subject + same contact within 5 minutes
  const dup = await pool.query(
    `SELECT id FROM inquiries
     WHERE created_by = $1
       AND LOWER(subject) = LOWER($2)
       AND contact_email IS NOT DISTINCT FROM $3
       AND contact_phone IS NOT DISTINCT FROM $4
       AND created_at > NOW() - INTERVAL '5 minutes'`,
    [user.id, subject, contactEmail, contactPhone]
  );
  if (dup.rows.length > 0) {
    throw new AppError(409, 'DUPLICATE_INQUIRY', 'This inquiry was already submitted a moment ago', {
      existingId: dup.rows[0].id,
    });
  }

  const { rows } = await pool.query(
    `INSERT INTO inquiries (customer_name, contact_email, contact_phone, subject, description, created_by, assigned_to)
     VALUES ($1, $2, $3, $4, $5, $6, $6)
     RETURNING id`,
    [customerName, contactEmail, contactPhone, subject, description, user.id]
  );
  return getInquiry(user, rows[0].id);
}

async function updateStatus(user, id, { status, version }) {
  const current = await getInquiry(user, id); // 404 if missing or not allowed

  // Optimistic locking: the client must send the version it last saw
  if (current.version !== version) {
    throw new AppError(
      409,
      'STALE_INQUIRY',
      'This inquiry was updated by someone else. Reload to see the latest version.',
      { current }
    );
  }

  assertValidTransition(current.status, status);

  const { rowCount } = await pool.query(
    `UPDATE inquiries
     SET status = $1, version = version + 1, updated_at = NOW()
     WHERE id = $2 AND version = $3`,
    [status, id, version]
  );
  if (rowCount === 0) {
    // Someone updated it between our read and our write
    throw new AppError(409, 'STALE_INQUIRY', 'This inquiry was updated by someone else. Reload to see the latest version.');
  }

  return getInquiry(user, id);
}

module.exports = {
  listInquiries,
  getInquiry,
  createInquiry,
  updateStatus,
  assertValidTransition,
  ALLOWED_TRANSITIONS,
};