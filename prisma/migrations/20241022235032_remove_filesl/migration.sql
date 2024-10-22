-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT nextval('user_id_seq')::int;
