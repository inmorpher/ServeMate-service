/*
  Warnings:

  - The values [NONE] on the enum `Allergy` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Allergy_new" AS ENUM ('GLUTEN', 'DAIRY', 'EGG', 'PEANUT', 'TREENUT', 'FISH', 'SHELLFISH', 'SOY', 'SESAME', 'CELERY', 'MUSTARD', 'LUPIN', 'SULPHITES', 'MOLLUSCS');
ALTER TABLE "FoodItem" ALTER COLUMN "allergies" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "allergies" DROP DEFAULT;
ALTER TABLE "OrderDrinkItem" ALTER COLUMN "allergies" DROP DEFAULT;
ALTER TABLE "OrderFoodItem" ALTER COLUMN "allergies" DROP DEFAULT;
ALTER TABLE "Reservation" ALTER COLUMN "allergies" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "allergies" TYPE "Allergy_new"[] USING ("allergies"::text::"Allergy_new"[]);
ALTER TABLE "OrderFoodItem" ALTER COLUMN "allergies" TYPE "Allergy_new"[] USING ("allergies"::text::"Allergy_new"[]);
ALTER TABLE "OrderDrinkItem" ALTER COLUMN "allergies" TYPE "Allergy_new"[] USING ("allergies"::text::"Allergy_new"[]);
ALTER TABLE "FoodItem" ALTER COLUMN "allergies" TYPE "Allergy_new"[] USING ("allergies"::text::"Allergy_new"[]);
ALTER TABLE "Reservation" ALTER COLUMN "allergies" TYPE "Allergy_new"[] USING ("allergies"::text::"Allergy_new"[]);
ALTER TYPE "Allergy" RENAME TO "Allergy_old";
ALTER TYPE "Allergy_new" RENAME TO "Allergy";
DROP TYPE "Allergy_old";
ALTER TABLE "FoodItem" ALTER COLUMN "allergies" SET DEFAULT ARRAY[]::"Allergy"[];
ALTER TABLE "Order" ALTER COLUMN "allergies" SET DEFAULT ARRAY[]::"Allergy"[];
ALTER TABLE "OrderDrinkItem" ALTER COLUMN "allergies" SET DEFAULT ARRAY[]::"Allergy"[];
ALTER TABLE "OrderFoodItem" ALTER COLUMN "allergies" SET DEFAULT ARRAY[]::"Allergy"[];
ALTER TABLE "Reservation" ALTER COLUMN "allergies" SET DEFAULT ARRAY[]::"Allergy"[];
COMMIT;
