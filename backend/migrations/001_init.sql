CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inquiries (
  id             SERIAL PRIMARY KEY,
  customer_name  VARCHAR(100) NOT NULL,
  contact_email  VARCHAR(255),
  contact_phone  VARCHAR(20),
  subject        VARCHAR(150) NOT NULL,
  description    TEXT NOT NULL,
  status         VARCHAR(20) NOT NULL DEFAULT 'NEW'
                 CHECK (status IN ('NEW', 'IN_PROGRESS', 'RESOLVED')),
  created_by     INTEGER NOT NULL REFERENCES users(id),
  assigned_to    INTEGER REFERENCES users(id),
  version        INTEGER NOT NULL DEFAULT 1,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contact_required
    CHECK (contact_email IS NOT NULL OR contact_phone IS NOT NULL)
);

CREATE INDEX idx_inquiries_status      ON inquiries(status);
CREATE INDEX idx_inquiries_created_by  ON inquiries(created_by);
CREATE INDEX idx_inquiries_assigned_to ON inquiries(assigned_to);