/*
  Warnings:

  - The primary key for the `DrinkItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `DrinkItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `FoodItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `FoodItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Order` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `OrderDrinkItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `OrderFoodItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Payment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Table` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Table` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `orderId` on the `OrderDrinkItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `drinkItemId` on the `OrderDrinkItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `orderId` on the `OrderFoodItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `foodItemId` on the `OrderFoodItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `tableId` on the `Payment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `orderId` on the `Payment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "OrderDrinkItem" DROP CONSTRAINT "OrderDrinkItem_drinkItemId_fkey";

-- DropForeignKey
ALTER TABLE "OrderDrinkItem" DROP CONSTRAINT "OrderDrinkItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "OrderFoodItem" DROP CONSTRAINT "OrderFoodItem_foodItemId_fkey";

-- DropForeignKey
ALTER TABLE "OrderFoodItem" DROP CONSTRAINT "OrderFoodItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_tableId_fkey";

-- AlterTable
ALTER TABLE "DrinkItem" DROP CONSTRAINT "DrinkItem_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "DrinkItem_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "FoodItem" DROP CONSTRAINT "FoodItem_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "FoodItem_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Order" DROP CONSTRAINT "Order_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Order_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "OrderDrinkItem" DROP CONSTRAINT "OrderDrinkItem_pkey",
DROP COLUMN "orderId",
ADD COLUMN     "orderId" INTEGER NOT NULL,
DROP COLUMN "drinkItemId",
ADD COLUMN     "drinkItemId" INTEGER NOT NULL,
ADD CONSTRAINT "OrderDrinkItem_pkey" PRIMARY KEY ("orderId", "drinkItemId", "guestNumber");

-- AlterTable
ALTER TABLE "OrderFoodItem" DROP CONSTRAINT "OrderFoodItem_pkey",
DROP COLUMN "orderId",
ADD COLUMN     "orderId" INTEGER NOT NULL,
DROP COLUMN "foodItemId",
ADD COLUMN     "foodItemId" INTEGER NOT NULL,
ADD CONSTRAINT "OrderFoodItem_pkey" PRIMARY KEY ("orderId", "foodItemId", "guestNumber");

-- AlterTable
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "tableId",
ADD COLUMN     "tableId" INTEGER NOT NULL,
DROP COLUMN "orderId",
ADD COLUMN     "orderId" INTEGER NOT NULL,
ADD CONSTRAINT "Payment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Table" DROP CONSTRAINT "Table_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Table_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT nextval('user_id_seq')::int;

-- AddForeignKey
ALTER TABLE "OrderFoodItem" ADD CONSTRAINT "OrderFoodItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderFoodItem" ADD CONSTRAINT "OrderFoodItem_foodItemId_fkey" FOREIGN KEY ("foodItemId") REFERENCES "FoodItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDrinkItem" ADD CONSTRAINT "OrderDrinkItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDrinkItem" ADD CONSTRAINT "OrderDrinkItem_drinkItemId_fkey" FOREIGN KEY ("drinkItemId") REFERENCES "DrinkItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
