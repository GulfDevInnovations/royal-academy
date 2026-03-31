/*
  Warnings:

  - You are about to drop the column `paymentId` on the `trial_bookings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[trialBookingId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "trial_bookings" DROP CONSTRAINT "trial_bookings_paymentId_fkey";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "trialBookingId" TEXT,
ALTER COLUMN "bookingId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "trial_bookings" DROP COLUMN "paymentId";

-- CreateIndex
CREATE UNIQUE INDEX "payments_trialBookingId_key" ON "payments"("trialBookingId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_trialBookingId_fkey" FOREIGN KEY ("trialBookingId") REFERENCES "trial_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
