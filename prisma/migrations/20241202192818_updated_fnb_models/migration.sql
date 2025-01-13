/*
  Warnings:

  - The primary key for the `OrderDrinkItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `OrderDrinkItem` table. All the data in the column will be lost.
  - The primary key for the `OrderFoodItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `OrderFoodItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OrderDrinkItem" DROP CONSTRAINT "OrderDrinkItem_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "OrderDrinkItem_pkey" PRIMARY KEY ("orderId", "itemId");

-- AlterTable
ALTER TABLE "OrderFoodItem" DROP CONSTRAINT "OrderFoodItem_pkey",
DROP COLUMN "id",
ADD COLUMN     "itemNumber" INTEGER NOT NULL DEFAULT 0,
ADD CONSTRAINT "OrderFoodItem_pkey" PRIMARY KEY ("orderId", "itemNumber", "itemId");

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT nextval('user_id_seq')::int;
