/*
  Warnings:

  - The values [DESERT,SOUSE] on the enum `FoodType` will be removed. If these variants are still used in the database, this will fail.
  - The `tempriture` column on the `DrinkItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `allergies` column on the `FoodItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `spicyLevel` column on the `FoodItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `paymentStatus` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `allergies` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `allergies` column on the `OrderDrinkItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `allergies` column on the `OrderFoodItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `paymentType` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Table` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `actionType` on the `orderServerAction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'HOST', 'MANAGER');

-- CreateEnum
CREATE TYPE "OrderState" AS ENUM ('AWAITING', 'RECEIVED', 'SERVED', 'CANCELED', 'DISPUTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SpiceLevel" AS ENUM ('NOT_SPICY', 'MILD', 'MEDIUM', 'HOT', 'EXTRA_HOT');

-- CreateEnum
CREATE TYPE "PaymentState" AS ENUM ('NONE', 'PAID', 'REFUNDED', 'CANCELLED', 'PENDING');

-- CreateEnum
CREATE TYPE "DrinkTemp" AS ENUM ('COLD', 'ROOM', 'HOT');

-- CreateEnum
CREATE TYPE "TableCondition" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'ORDERING', 'SERVING', 'PAYMENT');

-- CreateEnum
CREATE TYPE "OrderAction" AS ENUM ('CREATE', 'UPDATE', 'ADD_ITEM', 'REMOVE_ITEM', 'CHANGE_STATUS');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD');

-- CreateEnum
CREATE TYPE "Allergy" AS ENUM ('NONE', 'GLUTEN', 'DAIRY', 'EGG', 'PEANUT', 'TREENUT', 'FISH', 'SHELLFISH', 'SOY', 'SESAME', 'CELERY', 'MUSTARD', 'LUPIN', 'SULPHITES', 'MOLLUSCS');

-- AlterEnum
BEGIN;
CREATE TYPE "FoodType_new" AS ENUM ('APPETIZER', 'MAIN_COURSE', 'DESSERT', 'SIDES', 'SAUCE', 'OTHER');
ALTER TABLE "FoodItem" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "FoodItem" ALTER COLUMN "type" TYPE "FoodType_new" USING ("type"::text::"FoodType_new");
ALTER TYPE "FoodType" RENAME TO "FoodType_old";
ALTER TYPE "FoodType_new" RENAME TO "FoodType";
DROP TYPE "FoodType_old";
ALTER TABLE "FoodItem" ALTER COLUMN "type" SET DEFAULT 'OTHER';
COMMIT;

-- AlterTable
ALTER TABLE "DrinkItem" DROP COLUMN "tempriture",
ADD COLUMN     "tempriture" "DrinkTemp" NOT NULL DEFAULT 'ROOM';

-- AlterTable
ALTER TABLE "FoodItem" DROP COLUMN "allergies",
ADD COLUMN     "allergies" "Allergy"[] DEFAULT ARRAY[]::"Allergy"[],
DROP COLUMN "spicyLevel",
ADD COLUMN     "spicyLevel" "SpiceLevel" NOT NULL DEFAULT 'NOT_SPICY';

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "paymentStatus",
ADD COLUMN     "paymentStatus" "PaymentState" NOT NULL DEFAULT 'NONE',
DROP COLUMN "allergies",
ADD COLUMN     "allergies" "Allergy"[] DEFAULT ARRAY[]::"Allergy"[],
DROP COLUMN "status",
ADD COLUMN     "status" "OrderState" NOT NULL DEFAULT 'RECEIVED';

-- AlterTable
ALTER TABLE "OrderDrinkItem" DROP COLUMN "allergies",
ADD COLUMN     "allergies" "Allergy"[] DEFAULT ARRAY[]::"Allergy"[];

-- AlterTable
ALTER TABLE "OrderFoodItem" DROP COLUMN "allergies",
ADD COLUMN     "allergies" "Allergy"[] DEFAULT ARRAY[]::"Allergy"[];

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "paymentType",
ADD COLUMN     "paymentType" "PaymentMethod" NOT NULL DEFAULT 'CASH';

-- AlterTable
ALTER TABLE "Table" DROP COLUMN "status",
ADD COLUMN     "status" "TableCondition" NOT NULL DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "orderServerAction" DROP COLUMN "actionType",
ADD COLUMN     "actionType" "OrderAction" NOT NULL;

-- DropEnum
DROP TYPE "Allergies";

-- DropEnum
DROP TYPE "DrinkTemperature";

-- DropEnum
DROP TYPE "OrderActionType";

-- DropEnum
DROP TYPE "OrderStatus";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "PaymentType";

-- DropEnum
DROP TYPE "Role";

-- DropEnum
DROP TYPE "SpicyLevel";

-- DropEnum
DROP TYPE "TableStatus";
