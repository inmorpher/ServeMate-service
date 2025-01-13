/*
  Warnings:

  - The primary key for the `OrderDrinkItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `OrderFoodItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[id]` on the table `OrderDrinkItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `OrderFoodItem` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "OrderDrinkItem" DROP CONSTRAINT "OrderDrinkItem_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "OrderDrinkItem_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "OrderFoodItem" DROP CONSTRAINT "OrderFoodItem_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "OrderFoodItem_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "OrderDrinkItem_id_key" ON "OrderDrinkItem"("id");

-- CreateIndex
CREATE UNIQUE INDEX "OrderFoodItem_id_key" ON "OrderFoodItem"("id");
