/*
  Warnings:

  - You are about to drop the column `quantity` on the `OrderFoodItem` table. All the data in the column will be lost.
  - Added the required column `finalPrice` to the `OrderFoodItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderFoodItem" DROP COLUMN "quantity",
ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "finalPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "fired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "printed" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "price" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT nextval('user_id_seq')::int;


-- -- CreateFunction
-- CREATE OR REPLACE FUNCTION calculate_order_food_item_price()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.price = (SELECT price FROM "FoodItem" WHERE id = NEW.foodItemId);
--   NEW.finalPrice = NEW.price * (1 - NEW.discount / 100) * NEW.quantity;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- CreateTrigger
-- CREATE TRIGGER order_food_item_price_calculation
-- BEFORE INSERT OR UPDATE ON "OrderFoodItem"
-- FOR EACH ROW
-- EXECUTE FUNCTION calculate_order_food_item_price();