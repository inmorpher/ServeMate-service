/*
  Warnings:

  - The primary key for the `DrinkItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `alchoholPercentage` on the `DrinkItem` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `DrinkItem` table. All the data in the column will be lost.
  - You are about to drop the column `ingridients` on the `DrinkItem` table. All the data in the column will be lost.
  - You are about to drop the column `tempreture` on the `DrinkItem` table. All the data in the column will be lost.
  - The `code` column on the `DrinkItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `code` on the `FoodItem` table. All the data in the column will be lost.
  - You are about to drop the column `ingridients` on the `FoodItem` table. All the data in the column will be lost.
  - You are about to drop the column `isVegeterian` on the `FoodItem` table. All the data in the column will be lost.
  - The primary key for the `OrderFoodItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `foodItemId` on the `OrderFoodItem` table. All the data in the column will be lost.
  - You are about to drop the `TableAssigment` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `itemId` to the `OrderFoodItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrderDrinkItem" DROP CONSTRAINT "OrderDrinkItem_drinkItemId_fkey";

-- DropForeignKey
ALTER TABLE "OrderFoodItem" DROP CONSTRAINT "OrderFoodItem_foodItemId_fkey";

-- DropForeignKey
ALTER TABLE "TableAssigment" DROP CONSTRAINT "TableAssigment_serverId_fkey";

-- DropForeignKey
ALTER TABLE "TableAssigment" DROP CONSTRAINT "TableAssigment_tableId_fkey";

-- DropIndex
DROP INDEX "DrinkItem_code_key";

-- DropIndex
DROP INDEX "FoodItem_code_key";

-- AlterTable
ALTER TABLE "DrinkItem" DROP CONSTRAINT "DrinkItem_pkey",
DROP COLUMN "alchoholPercentage",
DROP COLUMN "id",
DROP COLUMN "ingridients",
DROP COLUMN "tempreture",
ADD COLUMN     "alcoholPercentage" DOUBLE PRECISION,
ADD COLUMN     "ingredients" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "temperature" "DrinkTemperature" NOT NULL DEFAULT 'ROOM',
DROP COLUMN "code",
ADD COLUMN     "code" SERIAL NOT NULL,
ADD CONSTRAINT "DrinkItem_pkey" PRIMARY KEY ("code");

-- AlterTable
ALTER TABLE "FoodItem" DROP COLUMN "code",
DROP COLUMN "ingridients",
DROP COLUMN "isVegeterian",
ADD COLUMN     "ingredients" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isVegetarian" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "OrderFoodItem" DROP CONSTRAINT "OrderFoodItem_pkey",
DROP COLUMN "foodItemId",
ADD COLUMN     "itemId" INTEGER NOT NULL,
ADD CONSTRAINT "OrderFoodItem_pkey" PRIMARY KEY ("orderId", "itemId", "guestNumber");

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT nextval('user_id_seq')::int;

-- DropTable
DROP TABLE "TableAssigment";

-- CreateTable
CREATE TABLE "TableAssignment" (
    "id" SERIAL NOT NULL,
    "tableId" INTEGER NOT NULL,
    "serverId" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TableAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TableAssignment_tableId_serverId_key" ON "TableAssignment"("tableId", "serverId");

-- AddForeignKey
ALTER TABLE "OrderFoodItem" ADD CONSTRAINT "OrderFoodItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "FoodItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDrinkItem" ADD CONSTRAINT "OrderDrinkItem_drinkItemId_fkey" FOREIGN KEY ("drinkItemId") REFERENCES "DrinkItem"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableAssignment" ADD CONSTRAINT "TableAssignment_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableAssignment" ADD CONSTRAINT "TableAssignment_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
