/*
  Warnings:

  - The primary key for the `DrinkItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `code` on the `DrinkItem` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "OrderDrinkItem" DROP CONSTRAINT "OrderDrinkItem_drinkItemId_fkey";

-- AlterTable
ALTER TABLE "DrinkItem" DROP CONSTRAINT "DrinkItem_pkey",
DROP COLUMN "code",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "DrinkItem_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT nextval('user_id_seq')::int;

-- AddForeignKey
ALTER TABLE "OrderDrinkItem" ADD CONSTRAINT "OrderDrinkItem_drinkItemId_fkey" FOREIGN KEY ("drinkItemId") REFERENCES "DrinkItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
