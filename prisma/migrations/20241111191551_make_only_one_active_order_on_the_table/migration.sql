/*
  Warnings:

  - A unique constraint covering the columns `[tableNumber]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT nextval('user_id_seq')::int;

-- CreateIndex
CREATE UNIQUE INDEX "Order_tableNumber_key" ON "Order"("tableNumber");
