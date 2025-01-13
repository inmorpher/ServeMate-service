/*
  Warnings:

  - The primary key for the `OrderDrinkItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `OrderFoodItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `itemNumber` on the `OrderFoodItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OrderDrinkItem" DROP CONSTRAINT "OrderDrinkItem_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "OrderDrinkItem_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "OrderFoodItem" DROP CONSTRAINT "OrderFoodItem_pkey",
DROP COLUMN "itemNumber",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "OrderFoodItem_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT nextval('user_id_seq')::int;
