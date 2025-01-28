/*
  Warnings:

  - You are about to drop the column `paymentStatus` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `serverId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `tableId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `tableNumber` on the `Payment` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_serverId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "paymentStatus";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "serverId",
DROP COLUMN "tableId",
DROP COLUMN "tableNumber",
ADD COLUMN     "serviceCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "status" "PaymentState" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tip" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
