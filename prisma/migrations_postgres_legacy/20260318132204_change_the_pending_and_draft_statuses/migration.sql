-- ─────────────────────────────────────────────────────────────
-- Migration: remove PENDING from BookingStatus & PaymentStatus,
--            remove DRAFT from InvoiceStatus
-- Step 0: migrate existing PENDING/DRAFT data first
-- ─────────────────────────────────────────────────────────────

-- ── 0. Migrate existing data ──────────────────────────────────

UPDATE bookings             SET status = 'CONFIRMED' WHERE status = 'PENDING';
UPDATE monthly_enrollments  SET status = 'CONFIRMED' WHERE status = 'PENDING';
UPDATE multi_month_enrollments SET status = 'CONFIRMED' WHERE status = 'PENDING';
UPDATE trial_bookings       SET status = 'CONFIRMED' WHERE status = 'PENDING';
UPDATE workshop_bookings    SET status = 'CONFIRMED' WHERE status = 'PENDING';

UPDATE payments             SET status = 'PAID' WHERE status = 'PENDING';
UPDATE monthly_payments     SET status = 'PAID' WHERE status = 'PENDING';
UPDATE multi_month_payments SET status = 'PAID' WHERE status = 'PENDING';

UPDATE invoices             SET status = 'ISSUED' WHERE status = 'DRAFT';


-- ── 1. BookingStatus ──────────────────────────────────────────

ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'COMPLETED', 'NO_SHOW');

ALTER TABLE bookings
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE "BookingStatus" USING status::text::"BookingStatus",
  ALTER COLUMN status SET DEFAULT 'CONFIRMED';

ALTER TABLE monthly_enrollments
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE "BookingStatus" USING status::text::"BookingStatus",
  ALTER COLUMN status SET DEFAULT 'CONFIRMED';

ALTER TABLE multi_month_enrollments
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE "BookingStatus" USING status::text::"BookingStatus",
  ALTER COLUMN status SET DEFAULT 'CONFIRMED';

ALTER TABLE trial_bookings
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE "BookingStatus" USING status::text::"BookingStatus",
  ALTER COLUMN status SET DEFAULT 'CONFIRMED';

ALTER TABLE workshop_bookings
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE "BookingStatus" USING status::text::"BookingStatus",
  ALTER COLUMN status SET DEFAULT 'CONFIRMED';

DROP TYPE "BookingStatus_old";


-- ── 2. PaymentStatus ──────────────────────────────────────────

ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

ALTER TABLE payments
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE "PaymentStatus" USING status::text::"PaymentStatus",
  ALTER COLUMN status SET DEFAULT 'PAID';

ALTER TABLE monthly_payments
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE "PaymentStatus" USING status::text::"PaymentStatus",
  ALTER COLUMN status SET DEFAULT 'PAID';

ALTER TABLE multi_month_payments
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE "PaymentStatus" USING status::text::"PaymentStatus",
  ALTER COLUMN status SET DEFAULT 'PAID';

DROP TYPE "PaymentStatus_old";


-- ── 3. InvoiceStatus ──────────────────────────────────────────

ALTER TYPE "InvoiceStatus" RENAME TO "InvoiceStatus_old";
CREATE TYPE "InvoiceStatus" AS ENUM ('ISSUED', 'PAID', 'OVERDUE', 'CANCELLED');

ALTER TABLE invoices
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE "InvoiceStatus" USING status::text::"InvoiceStatus",
  ALTER COLUMN status SET DEFAULT 'ISSUED';

DROP TYPE "InvoiceStatus_old";