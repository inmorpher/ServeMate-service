/*
  Warnings:

  - You are about to drop the column `code` on the `DrinkItem` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `FoodItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id]` on the table `FoodItem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "DrinkItem_code_key";

-- DropIndex
DROP INDEX "FoodItem_code_key";

-- AlterTable
ALTER TABLE "DrinkItem" DROP COLUMN "code";

-- AlterTable
ALTER TABLE "FoodItem" DROP COLUMN "code";

-- CreateIndex
CREATE UNIQUE INDEX "FoodItem_id_key" ON "FoodItem"("id");
