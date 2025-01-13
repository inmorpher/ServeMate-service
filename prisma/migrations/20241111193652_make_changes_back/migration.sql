-- DropIndex
DROP INDEX "Order_tableNumber_key";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT nextval('user_id_seq')::int;
