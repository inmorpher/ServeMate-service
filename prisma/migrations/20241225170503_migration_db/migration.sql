/*
  Warnings:

  - You are about to drop the column `alcoholPercentage` on the `DrinkItem` table. All the data in the column will be lost.
  - You are about to drop the column `ingredients` on the `DrinkItem` table. All the data in the column will be lost.
  - You are about to drop the column `temperature` on the `DrinkItem` table. All the data in the column will be lost.
  - You are about to drop the column `ingredients` on the `FoodItem` table. All the data in the column will be lost.
  - You are about to drop the column `isVegetarian` on the `FoodItem` table. All the data in the column will be lost.
  - The primary key for the `OrderDrinkItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `discount` on the `OrderDrinkItem` table. All the data in the column will be lost.
  - You are about to drop the column `finalPrice` on the `OrderDrinkItem` table. All the data in the column will be lost.
  - You are about to drop the column `fired` on the `OrderDrinkItem` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `OrderDrinkItem` table. All the data in the column will be lost.
  - You are about to drop the column `itemId` on the `OrderDrinkItem` table. All the data in the column will be lost.
  - You are about to drop the column `printed` on the `OrderDrinkItem` table. All the data in the column will be lost.
  - The primary key for the `OrderFoodItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `OrderFoodItem` table. All the data in the column will be lost.
  - You are about to drop the column `itemId` on the `OrderFoodItem` table. All the data in the column will be lost.
  - You are about to drop the `TableAssignment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `DrinkItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `FoodItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `DrinkItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `FoodItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `drinkItemId` to the `OrderDrinkItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `OrderDrinkItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `foodItemId` to the `OrderFoodItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrderDrinkItem" DROP CONSTRAINT "OrderDrinkItem_itemId_fkey";

-- DropForeignKey
ALTER TABLE "OrderFoodItem" DROP CONSTRAINT "OrderFoodItem_itemId_fkey";

-- DropForeignKey
ALTER TABLE "TableAssignment" DROP CONSTRAINT "TableAssignment_serverId_fkey";

-- DropForeignKey
ALTER TABLE "TableAssignment" DROP CONSTRAINT "TableAssignment_tableId_fkey";

-- AlterTable
ALTER TABLE "DrinkItem" DROP COLUMN "alcoholPercentage",
DROP COLUMN "ingredients",
DROP COLUMN "temperature",
ADD COLUMN     "alchoholPercentage" DOUBLE PRECISION,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "ingridients" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tempreture" "DrinkTemperature" NOT NULL DEFAULT 'ROOM';

-- AlterTable
ALTER TABLE "FoodItem" DROP COLUMN "ingredients",
DROP COLUMN "isVegetarian",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "ingridients" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isVegeterian" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "OrderDrinkItem" DROP CONSTRAINT "OrderDrinkItem_pkey",
DROP COLUMN "discount",
DROP COLUMN "finalPrice",
DROP COLUMN "fired",
DROP COLUMN "id",
DROP COLUMN "itemId",
DROP COLUMN "printed",
ADD COLUMN     "drinkItemId" INTEGER NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL,
ALTER COLUMN "price" SET DEFAULT 0,
ADD CONSTRAINT "OrderDrinkItem_pkey" PRIMARY KEY ("orderId", "drinkItemId", "guestNumber");

-- AlterTable
ALTER TABLE "OrderFoodItem" DROP CONSTRAINT "OrderFoodItem_pkey",
DROP COLUMN "id",
DROP COLUMN "itemId",
ADD COLUMN     "foodItemId" INTEGER NOT NULL,
ADD CONSTRAINT "OrderFoodItem_pkey" PRIMARY KEY ("orderId", "foodItemId", "guestNumber");

-- DropTable
DROP TABLE "TableAssignment";

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

-- CreateIndex
CREATE UNIQUE INDEX "TableAssigment_tableId_serverId_key" ON "TableAssigment"("tableId", "serverId");

-- CreateIndex
CREATE UNIQUE INDEX "DrinkItem_code_key" ON "DrinkItem"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FoodItem_code_key" ON "FoodItem"("code");

-- AddForeignKey
ALTER TABLE "OrderFoodItem" ADD CONSTRAINT "OrderFoodItem_foodItemId_fkey" FOREIGN KEY ("foodItemId") REFERENCES "FoodItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDrinkItem" ADD CONSTRAINT "OrderDrinkItem_drinkItemId_fkey" FOREIGN KEY ("drinkItemId") REFERENCES "DrinkItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableAssigment" ADD CONSTRAINT "TableAssigment_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableAssigment" ADD CONSTRAINT "TableAssigment_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
