/*
  Warnings:

  - You are about to drop the column `serverId` on the `Table` table. All the data in the column will be lost.
  - Added the required column `tableNumber` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalCapacity` to the `Table` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderActionType" AS ENUM ('CREATE', 'UPDATE', 'ADD_ITEM', 'REMOVE_ITEM', 'CHANGE_STATUS');

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_tableId_fkey";

-- DropForeignKey
ALTER TABLE "Table" DROP CONSTRAINT "Table_serverId_fkey";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "tableNumber" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Table" DROP COLUMN "serverId",
ADD COLUMN     "additionalCapacity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isOccupied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalCapacity" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT nextval('user_id_seq')::int;

-- CreateTable
CREATE TABLE "TableAssigment" (
    "id" SERIAL NOT NULL,
    "tableId" INTEGER NOT NULL,
    "serverId" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TableAssigment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orderServerAction" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "serverId" INTEGER NOT NULL,
    "actionType" "OrderActionType" NOT NULL,
    "actionTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,

    CONSTRAINT "orderServerAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TableAssigment_tableId_serverId_key" ON "TableAssigment"("tableId", "serverId");

-- AddForeignKey
ALTER TABLE "TableAssigment" ADD CONSTRAINT "TableAssigment_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableAssigment" ADD CONSTRAINT "TableAssigment_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderServerAction" ADD CONSTRAINT "orderServerAction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderServerAction" ADD CONSTRAINT "orderServerAction_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
