/*
  Warnings:

  - Added the required column `sessionDatetime` to the `class_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'INAPP';

-- AlterTable
ALTER TABLE "class_sessions" ADD COLUMN     "sessionDatetime" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "monthly_enrollments" ADD COLUMN     "multiMonthEnrollmentId" TEXT;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "linkUrl" TEXT,
ADD COLUMN     "readAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "sub_classes" ADD COLUMN     "isReschedulable" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "reschedule_logs" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "oldBookingId" TEXT NOT NULL,
    "newBookingId" TEXT,
    "oldSessionId" TEXT NOT NULL,
    "newSessionId" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wasLost" BOOLEAN NOT NULL DEFAULT false,
    "lostReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reschedule_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "multi_month_enrollments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subClassId" TEXT NOT NULL,
    "frequency" "FrequencyType" NOT NULL,
    "preferredDays" "DayOfWeek"[],
    "startMonth" INTEGER NOT NULL,
    "startYear" INTEGER NOT NULL,
    "endMonth" INTEGER NOT NULL,
    "endYear" INTEGER NOT NULL,
    "totalMonths" INTEGER NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'OMR',
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "multi_month_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "multi_month_payments" (
    "id" TEXT NOT NULL,
    "multiMonthEnrollmentId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'OMR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "PaymentMethod",
    "stripePaymentIntentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "multi_month_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_replies" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_replies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reschedule_logs_studentId_idx" ON "reschedule_logs"("studentId");

-- CreateIndex
CREATE INDEX "reschedule_logs_oldBookingId_idx" ON "reschedule_logs"("oldBookingId");

-- CreateIndex
CREATE INDEX "multi_month_enrollments_studentId_idx" ON "multi_month_enrollments"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "multi_month_payments_multiMonthEnrollmentId_key" ON "multi_month_payments"("multiMonthEnrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "multi_month_payments_stripePaymentIntentId_key" ON "multi_month_payments"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "class_sessions_sessionDatetime_idx" ON "class_sessions"("sessionDatetime");

-- AddForeignKey
ALTER TABLE "reschedule_logs" ADD CONSTRAINT "reschedule_logs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reschedule_logs" ADD CONSTRAINT "reschedule_logs_oldBookingId_fkey" FOREIGN KEY ("oldBookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reschedule_logs" ADD CONSTRAINT "reschedule_logs_newBookingId_fkey" FOREIGN KEY ("newBookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reschedule_logs" ADD CONSTRAINT "reschedule_logs_oldSessionId_fkey" FOREIGN KEY ("oldSessionId") REFERENCES "class_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reschedule_logs" ADD CONSTRAINT "reschedule_logs_newSessionId_fkey" FOREIGN KEY ("newSessionId") REFERENCES "class_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_enrollments" ADD CONSTRAINT "monthly_enrollments_multiMonthEnrollmentId_fkey" FOREIGN KEY ("multiMonthEnrollmentId") REFERENCES "multi_month_enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multi_month_enrollments" ADD CONSTRAINT "multi_month_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multi_month_enrollments" ADD CONSTRAINT "multi_month_enrollments_subClassId_fkey" FOREIGN KEY ("subClassId") REFERENCES "sub_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multi_month_payments" ADD CONSTRAINT "multi_month_payments_multiMonthEnrollmentId_fkey" FOREIGN KEY ("multiMonthEnrollmentId") REFERENCES "multi_month_enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_replies" ADD CONSTRAINT "ticket_replies_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_replies" ADD CONSTRAINT "ticket_replies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
