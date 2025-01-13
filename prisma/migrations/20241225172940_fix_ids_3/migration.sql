/*
  Warnings:

  - You are about to drop the column `drinkItemId` on the `OrderDrinkItem` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `OrderDrinkItem` table. All the data in the column will be lost.
  - You are about to drop the column `foodItemId` on the `OrderFoodItem` table. All the data in the column will be lost.
  - Added the required column `finalPrice` to the `OrderDrinkItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemId` to the `OrderDrinkItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemId` to the `OrderFoodItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrderDrinkItem" DROP CONSTRAINT "OrderDrinkItem_drinkItemId_fkey";

-- DropForeignKey
ALTER TABLE "OrderFoodItem" DROP CONSTRAINT "OrderFoodItem_foodItemId_fkey";

-- AlterTable
ALTER TABLE "OrderDrinkItem" DROP COLUMN "drinkItemId",
DROP COLUMN "quantity",
ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "finalPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "fired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "itemId" INTEGER NOT NULL,
ADD COLUMN     "printed" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "price" DROP DEFAULT;

-- AlterTable
ALTER TABLE "OrderFoodItem" DROP COLUMN "foodItemId",
ADD COLUMN     "itemId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "OrderFoodItem" ADD CONSTRAINT "OrderFoodItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "FoodItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDrinkItem" ADD CONSTRAINT "OrderDrinkItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "DrinkItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
