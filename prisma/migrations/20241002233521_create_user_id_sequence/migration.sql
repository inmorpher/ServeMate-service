-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'HOST', 'MANAGER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('RECEIVED', 'PREPARING', 'SERVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SpicyLevel" AS ENUM ('NOT_SPICY', 'MILD', 'MEDIUM', 'HOT', 'EXTRA_HOT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NONE', 'PAID', 'REFUNDED', 'CANCELLED', 'PENDING');

-- CreateEnum
CREATE TYPE "DrinkTemperature" AS ENUM ('COLD', 'ROOM', 'HOT');

-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'ORDERING', 'SERVING', 'PAYMENT');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD');

-- CreateEnum
CREATE TYPE "Allergies" AS ENUM ('NONE', 'GLUTEN', 'DAIRY', 'EGG', 'PEANUT', 'TREENUT', 'FISH', 'SHELLFISH', 'SOY', 'SESAME', 'CELERY', 'MUSTARD', 'LUPIN', 'SULPHITES', 'MOLLUSCS');

-- CreateEnum
CREATE TYPE "FoodType" AS ENUM ('APPETIZER', 'MAIN_COURSE', 'DESERT', 'SIDES', 'SOUSE', 'OTHER');

-- CreateEnum
CREATE TYPE "FoodCategory" AS ENUM ('SALAD', 'MEAT', 'SOUP', 'FISH', 'VEGGIES', 'OTHER', 'SEAFOOD');

-- CreateEnum
CREATE TYPE "DrinkCategory" AS ENUM ('BEER', 'WINE', 'SPIRITS', 'COFFEE', 'TEA', 'OTHER', 'SODA', 'ALCOHOLIC', 'NON_ALCOHOLIC');

CREATE SEQUENCE user_id_seq START WITH 100000;

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL DEFAULT nextval('user_id_seq')::int,
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "refreshToken" TEXT,
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "tableNumber" INTEGER NOT NULL,
    "orderNumber" INTEGER NOT NULL,
    "guestsCount" INTEGER NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NONE',
    "orderTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "allergies" "Allergies"[] DEFAULT ARRAY[]::"Allergies"[],
    "serverId" INTEGER NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "OrderStatus" NOT NULL DEFAULT 'RECEIVED',
    "comments" TEXT,
    "completionTime" TIMESTAMP(3),
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tip" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shiftId" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderFoodItem" (
    "orderId" TEXT NOT NULL,
    "foodItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "guestNumber" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "specialRequest" TEXT,
    "allergies" "Allergies"[] DEFAULT ARRAY[]::"Allergies"[],

    CONSTRAINT "OrderFoodItem_pkey" PRIMARY KEY ("orderId","foodItemId","guestNumber")
);

-- CreateTable
CREATE TABLE "OrderDrinkItem" (
    "orderId" TEXT NOT NULL,
    "drinkItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "guestNumber" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "specialRequest" TEXT,
    "allergies" "Allergies"[] DEFAULT ARRAY[]::"Allergies"[],

    CONSTRAINT "OrderDrinkItem_pkey" PRIMARY KEY ("orderId","drinkItemId","guestNumber")
);

-- CreateTable
CREATE TABLE "FoodItem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "type" "FoodType" NOT NULL DEFAULT 'OTHER',
    "category" "FoodCategory" NOT NULL DEFAULT 'OTHER',
    "allergies" "Allergies"[] DEFAULT ARRAY[]::"Allergies"[],
    "ingridients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT NOT NULL DEFAULT '',
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "preparationTime" INTEGER NOT NULL DEFAULT 0,
    "calories" INTEGER,
    "image" TEXT,
    "spicyLevel" "SpicyLevel" NOT NULL DEFAULT 'NOT_SPICY',
    "popularityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isVegeterian" BOOLEAN NOT NULL DEFAULT false,
    "isVegan" BOOLEAN NOT NULL DEFAULT false,
    "isGlutenFree" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrinkItem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "category" "DrinkCategory" NOT NULL DEFAULT 'OTHER',
    "description" TEXT NOT NULL DEFAULT '',
    "ingridients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "volume" INTEGER NOT NULL,
    "alchoholPercentage" DOUBLE PRECISION,
    "image" TEXT,
    "isCarbonated" BOOLEAN NOT NULL DEFAULT false,
    "tempreture" "DrinkTemperature" NOT NULL DEFAULT 'ROOM',
    "popularityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrinkItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Table" (
    "id" TEXT NOT NULL,
    "tableNumber" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "TableStatus" NOT NULL DEFAULT 'AVAILABLE',
    "serverId" INTEGER,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentType" "PaymentType" NOT NULL DEFAULT 'CASH',
    "paymentTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tableId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "serverId" INTEGER NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FoodItem_code_key" ON "FoodItem"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DrinkItem_code_key" ON "DrinkItem"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Table_tableNumber_key" ON "Table"("tableNumber");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tableNumber_fkey" FOREIGN KEY ("tableNumber") REFERENCES "Table"("tableNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderFoodItem" ADD CONSTRAINT "OrderFoodItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderFoodItem" ADD CONSTRAINT "OrderFoodItem_foodItemId_fkey" FOREIGN KEY ("foodItemId") REFERENCES "FoodItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDrinkItem" ADD CONSTRAINT "OrderDrinkItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDrinkItem" ADD CONSTRAINT "OrderDrinkItem_drinkItemId_fkey" FOREIGN KEY ("drinkItemId") REFERENCES "DrinkItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
