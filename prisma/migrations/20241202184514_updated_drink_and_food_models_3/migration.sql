/*
  Warnings:

  - The primary key for the `OrderDrinkItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `drinkItemId` on the `OrderDrinkItem` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `OrderDrinkItem` table. All the data in the column will be lost.
  - The primary key for the `OrderFoodItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `finalPrice` to the `OrderDrinkItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemId` to the `OrderDrinkItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrderDrinkItem" DROP CONSTRAINT "OrderDrinkItem_drinkItemId_fkey";

-- AlterTable
ALTER TABLE "OrderDrinkItem" DROP CONSTRAINT "OrderDrinkItem_pkey",
DROP COLUMN "drinkItemId",
DROP COLUMN "quantity",
ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "finalPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "fired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "itemId" INTEGER NOT NULL,
ADD COLUMN     "printed" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "price" DROP DEFAULT,
ADD CONSTRAINT "OrderDrinkItem_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "OrderFoodItem" DROP CONSTRAINT "OrderFoodItem_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "OrderFoodItem_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT nextval('user_id_seq')::int;

-- AddForeignKey
ALTER TABLE "OrderDrinkItem" ADD CONSTRAINT "OrderDrinkItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "DrinkItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
