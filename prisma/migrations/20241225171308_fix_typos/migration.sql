/*
  Warnings:

  - You are about to drop the column `alchoholPercentage` on the `DrinkItem` table. All the data in the column will be lost.
  - You are about to drop the column `ingridients` on the `DrinkItem` table. All the data in the column will be lost.
  - You are about to drop the column `tempreture` on the `DrinkItem` table. All the data in the column will be lost.
  - You are about to drop the column `ingridients` on the `FoodItem` table. All the data in the column will be lost.
  - You are about to drop the column `isVegeterian` on the `FoodItem` table. All the data in the column will be lost.
  - You are about to drop the `TableAssigment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TableAssigment" DROP CONSTRAINT "TableAssigment_serverId_fkey";

-- DropForeignKey
ALTER TABLE "TableAssigment" DROP CONSTRAINT "TableAssigment_tableId_fkey";

-- AlterTable
ALTER TABLE "DrinkItem" DROP COLUMN "alchoholPercentage",
DROP COLUMN "ingridients",
DROP COLUMN "tempreture",
ADD COLUMN     "alcoholPercentage" DOUBLE PRECISION,
ADD COLUMN     "ingredients" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tempriture" "DrinkTemperature" NOT NULL DEFAULT 'ROOM';

-- AlterTable
ALTER TABLE "FoodItem" DROP COLUMN "ingridients",
DROP COLUMN "isVegeterian",
ADD COLUMN     "ingredients" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isVegetarian" BOOLEAN NOT NULL DEFAULT false;

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
ALTER TABLE "TableAssignment" ADD CONSTRAINT "TableAssignment_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableAssignment" ADD CONSTRAINT "TableAssignment_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
