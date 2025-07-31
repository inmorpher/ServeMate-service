/*
  Warnings:

  - The primary key for the `_OrderDrinkItemToPayment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_OrderDrinkItemToRefundPayment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_OrderFoodItemToPayment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_OrderFoodItemToRefundPayment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_OrderToReservation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_ReservationToTable` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_OrderDrinkItemToPayment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_OrderDrinkItemToRefundPayment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_OrderFoodItemToPayment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_OrderFoodItemToRefundPayment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_OrderToReservation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_ReservationToTable` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "_OrderDrinkItemToPayment" DROP CONSTRAINT "_OrderDrinkItemToPayment_AB_pkey";

-- AlterTable
ALTER TABLE "_OrderDrinkItemToRefundPayment" DROP CONSTRAINT "_OrderDrinkItemToRefundPayment_AB_pkey";

-- AlterTable
ALTER TABLE "_OrderFoodItemToPayment" DROP CONSTRAINT "_OrderFoodItemToPayment_AB_pkey";

-- AlterTable
ALTER TABLE "_OrderFoodItemToRefundPayment" DROP CONSTRAINT "_OrderFoodItemToRefundPayment_AB_pkey";

-- AlterTable
ALTER TABLE "_OrderToReservation" DROP CONSTRAINT "_OrderToReservation_AB_pkey";

-- AlterTable
ALTER TABLE "_ReservationToTable" DROP CONSTRAINT "_ReservationToTable_AB_pkey";

-- CreateIndex
CREATE INDEX "idx_order_total_amount" ON "Order"("totalAmount");

-- CreateIndex
CREATE INDEX "idx_order_status" ON "Order"("status");

-- CreateIndex
CREATE INDEX "idx_order_table_number" ON "Order"("tableNumber");

-- CreateIndex
CREATE INDEX "idx_order_server_id" ON "Order"("serverId");

-- CreateIndex
CREATE INDEX "idx_order_time" ON "Order"("orderTime");

-- CreateIndex
CREATE UNIQUE INDEX "_OrderDrinkItemToPayment_AB_unique" ON "_OrderDrinkItemToPayment"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_OrderDrinkItemToRefundPayment_AB_unique" ON "_OrderDrinkItemToRefundPayment"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_OrderFoodItemToPayment_AB_unique" ON "_OrderFoodItemToPayment"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_OrderFoodItemToRefundPayment_AB_unique" ON "_OrderFoodItemToRefundPayment"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_OrderToReservation_AB_unique" ON "_OrderToReservation"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_ReservationToTable_AB_unique" ON "_ReservationToTable"("A", "B");
