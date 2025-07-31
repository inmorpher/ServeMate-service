-- AlterTable
ALTER TABLE "_OrderDrinkItemToPayment" ADD CONSTRAINT "_OrderDrinkItemToPayment_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_OrderDrinkItemToPayment_AB_unique";

-- AlterTable
ALTER TABLE "_OrderDrinkItemToRefundPayment" ADD CONSTRAINT "_OrderDrinkItemToRefundPayment_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_OrderDrinkItemToRefundPayment_AB_unique";

-- AlterTable
ALTER TABLE "_OrderFoodItemToPayment" ADD CONSTRAINT "_OrderFoodItemToPayment_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_OrderFoodItemToPayment_AB_unique";

-- AlterTable
ALTER TABLE "_OrderFoodItemToRefundPayment" ADD CONSTRAINT "_OrderFoodItemToRefundPayment_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_OrderFoodItemToRefundPayment_AB_unique";

-- AlterTable
ALTER TABLE "_OrderToReservation" ADD CONSTRAINT "_OrderToReservation_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_OrderToReservation_AB_unique";

-- AlterTable
ALTER TABLE "_ReservationToTable" ADD CONSTRAINT "_ReservationToTable_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ReservationToTable_AB_unique";

-- CreateIndex
CREATE INDEX "idx_order_guests_count" ON "Order"("guestsCount");
