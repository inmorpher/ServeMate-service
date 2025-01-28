-- AlterTable
ALTER TABLE "OrderDrinkItem" ADD COLUMN     "paymentStatus" "PaymentState" NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "OrderFoodItem" ADD COLUMN     "paymentStatus" "PaymentState" NOT NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "_OrderFoodItemToRefundPayment" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_OrderFoodItemToRefundPayment_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_OrderFoodItemToPayment" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_OrderFoodItemToPayment_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_OrderDrinkItemToRefundPayment" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_OrderDrinkItemToRefundPayment_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_OrderDrinkItemToPayment" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_OrderDrinkItemToPayment_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_OrderFoodItemToRefundPayment_B_index" ON "_OrderFoodItemToRefundPayment"("B");

-- CreateIndex
CREATE INDEX "_OrderFoodItemToPayment_B_index" ON "_OrderFoodItemToPayment"("B");

-- CreateIndex
CREATE INDEX "_OrderDrinkItemToRefundPayment_B_index" ON "_OrderDrinkItemToRefundPayment"("B");

-- CreateIndex
CREATE INDEX "_OrderDrinkItemToPayment_B_index" ON "_OrderDrinkItemToPayment"("B");

-- AddForeignKey
ALTER TABLE "_OrderFoodItemToRefundPayment" ADD CONSTRAINT "_OrderFoodItemToRefundPayment_A_fkey" FOREIGN KEY ("A") REFERENCES "OrderFoodItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderFoodItemToRefundPayment" ADD CONSTRAINT "_OrderFoodItemToRefundPayment_B_fkey" FOREIGN KEY ("B") REFERENCES "RefundPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderFoodItemToPayment" ADD CONSTRAINT "_OrderFoodItemToPayment_A_fkey" FOREIGN KEY ("A") REFERENCES "OrderFoodItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderFoodItemToPayment" ADD CONSTRAINT "_OrderFoodItemToPayment_B_fkey" FOREIGN KEY ("B") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderDrinkItemToRefundPayment" ADD CONSTRAINT "_OrderDrinkItemToRefundPayment_A_fkey" FOREIGN KEY ("A") REFERENCES "OrderDrinkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderDrinkItemToRefundPayment" ADD CONSTRAINT "_OrderDrinkItemToRefundPayment_B_fkey" FOREIGN KEY ("B") REFERENCES "RefundPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderDrinkItemToPayment" ADD CONSTRAINT "_OrderDrinkItemToPayment_A_fkey" FOREIGN KEY ("A") REFERENCES "OrderDrinkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderDrinkItemToPayment" ADD CONSTRAINT "_OrderDrinkItemToPayment_B_fkey" FOREIGN KEY ("B") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
