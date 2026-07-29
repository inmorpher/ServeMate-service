/*
  Warnings:

  - You are about to drop the column `allergies` on the `FoodItem` table. All the data in the column will be lost.
  - You are about to drop the column `allergies` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `allergies` on the `OrderDrinkItem` table. All the data in the column will be lost.
  - You are about to drop the column `allergies` on the `OrderFoodItem` table. All the data in the column will be lost.
  - You are about to drop the column `allergies` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the `_OrderToReservation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ReservationToTable` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_OrderToReservation" DROP CONSTRAINT "_OrderToReservation_A_fkey";

-- DropForeignKey
ALTER TABLE "_OrderToReservation" DROP CONSTRAINT "_OrderToReservation_B_fkey";

-- DropForeignKey
ALTER TABLE "_ReservationToTable" DROP CONSTRAINT "_ReservationToTable_A_fkey";

-- DropForeignKey
ALTER TABLE "_ReservationToTable" DROP CONSTRAINT "_ReservationToTable_B_fkey";

-- DropIndex
DROP INDEX "User_id_key";

-- AlterTable
ALTER TABLE "FoodItem" DROP COLUMN "allergies";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "allergies";

-- AlterTable
ALTER TABLE "OrderDrinkItem" DROP COLUMN "allergies";

-- AlterTable
ALTER TABLE "OrderFoodItem" DROP COLUMN "allergies";

-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "allergies";

-- AlterTable
CREATE SEQUENCE IF NOT EXISTS user_id_seq;
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT nextval('user_id_seq');
ALTER SEQUENCE user_id_seq OWNED BY "User"."id";

-- DropTable
DROP TABLE "_OrderToReservation";

-- DropTable
DROP TABLE "_ReservationToTable";

-- CreateTable
CREATE TABLE "OrderFoodItemAllergy" (
    "id" SERIAL NOT NULL,
    "orderFoodItemId" INTEGER NOT NULL,
    "allergy" "Allergy" NOT NULL,

    CONSTRAINT "OrderFoodItemAllergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderDrinkItemAllergy" (
    "id" SERIAL NOT NULL,
    "orderDrinkItemId" INTEGER NOT NULL,
    "allergy" "Allergy" NOT NULL,

    CONSTRAINT "OrderDrinkItemAllergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationTable" (
    "id" SERIAL NOT NULL,
    "reservationId" INTEGER NOT NULL,
    "tableNumber" INTEGER NOT NULL,

    CONSTRAINT "ReservationTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "refreshJti" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderFoodItemAllergy_orderFoodItemId_idx" ON "OrderFoodItemAllergy"("orderFoodItemId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderFoodItemAllergy_orderFoodItemId_allergy_key" ON "OrderFoodItemAllergy"("orderFoodItemId", "allergy");

-- CreateIndex
CREATE INDEX "OrderDrinkItemAllergy_orderDrinkItemId_idx" ON "OrderDrinkItemAllergy"("orderDrinkItemId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderDrinkItemAllergy_orderDrinkItemId_allergy_key" ON "OrderDrinkItemAllergy"("orderDrinkItemId", "allergy");

-- CreateIndex
CREATE INDEX "ReservationTable_reservationId_idx" ON "ReservationTable"("reservationId");

-- CreateIndex
CREATE INDEX "ReservationTable_tableNumber_idx" ON "ReservationTable"("tableNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationTable_reservationId_tableNumber_key" ON "ReservationTable"("reservationId", "tableNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshJti_key" ON "Session"("refreshJti");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- AddForeignKey
ALTER TABLE "OrderFoodItemAllergy" ADD CONSTRAINT "OrderFoodItemAllergy_orderFoodItemId_fkey" FOREIGN KEY ("orderFoodItemId") REFERENCES "OrderFoodItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDrinkItemAllergy" ADD CONSTRAINT "OrderDrinkItemAllergy_orderDrinkItemId_fkey" FOREIGN KEY ("orderDrinkItemId") REFERENCES "OrderDrinkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationTable" ADD CONSTRAINT "ReservationTable_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationTable" ADD CONSTRAINT "ReservationTable_tableNumber_fkey" FOREIGN KEY ("tableNumber") REFERENCES "Table"("tableNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
