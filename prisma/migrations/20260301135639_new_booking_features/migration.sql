-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('PUBLIC', 'MUSIC', 'TRIAL', 'WORKSHOP', 'PRIVATE');

-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('TRIAL', 'MONTHLY_ONCE', 'MONTHLY_TWICE', 'WORKSHOP', 'PRIVATE');

-- CreateEnum
CREATE TYPE "FrequencyType" AS ENUM ('ONCE_PER_WEEK', 'TWICE_PER_WEEK');

-- AlterTable
ALTER TABLE "class_schedules" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "sub_classes" ADD COLUMN     "isTrialAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "oncePriceMonthly" DECIMAL(10,2),
ADD COLUMN     "sessionType" "SessionType" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "trialPrice" DECIMAL(10,2) NOT NULL DEFAULT 10,
ADD COLUMN     "twicePriceMonthly" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "monthly_enrollments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subClassId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "frequency" "FrequencyType" NOT NULL,
    "preferredDays" "DayOfWeek"[],
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'OMR',
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teacherProfileId" TEXT,

    CONSTRAINT "monthly_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_payments" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'OMR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "PaymentMethod",
    "stripePaymentIntentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshops" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "teacherId" TEXT,
    "roomId" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'OMR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_bookings" (
    "id" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paymentId" TEXT,

    CONSTRAINT "workshop_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trial_bookings" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subClassId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paymentId" TEXT,

    CONSTRAINT "trial_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "monthly_enrollments_studentId_subClassId_month_year_key" ON "monthly_enrollments"("studentId", "subClassId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_payments_enrollmentId_key" ON "monthly_payments"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_payments_stripePaymentIntentId_key" ON "monthly_payments"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_bookings_workshopId_studentId_key" ON "workshop_bookings"("workshopId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "trial_bookings_studentId_subClassId_key" ON "trial_bookings"("studentId", "subClassId");

-- AddForeignKey
ALTER TABLE "monthly_enrollments" ADD CONSTRAINT "monthly_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_enrollments" ADD CONSTRAINT "monthly_enrollments_subClassId_fkey" FOREIGN KEY ("subClassId") REFERENCES "sub_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_enrollments" ADD CONSTRAINT "monthly_enrollments_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "teacher_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_payments" ADD CONSTRAINT "monthly_payments_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "monthly_enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshops" ADD CONSTRAINT "workshops_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshops" ADD CONSTRAINT "workshops_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_bookings" ADD CONSTRAINT "workshop_bookings_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "workshops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_bookings" ADD CONSTRAINT "workshop_bookings_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_bookings" ADD CONSTRAINT "workshop_bookings_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_bookings" ADD CONSTRAINT "trial_bookings_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_bookings" ADD CONSTRAINT "trial_bookings_subClassId_fkey" FOREIGN KEY ("subClassId") REFERENCES "sub_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_bookings" ADD CONSTRAINT "trial_bookings_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "class_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_bookings" ADD CONSTRAINT "trial_bookings_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
