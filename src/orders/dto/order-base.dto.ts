import { Allergy, OrderState, PaymentMethod } from '@prisma/client';

export type { Allergy, OrderState, PaymentMethod };

export const OrderSortOptions = {
  ID: 'id',
  TABLE_NUMBER: 'tableNumber',
  GUESTS_COUNT: 'guestsCount',
  ORDER_TIME: 'orderTime',
  UPDATED_AT: 'updatedAt',
  STATUS: 'status',
  TOTAL_AMOUNT: 'totalAmount',
} as const;

export type OrderSortOption =
  (typeof OrderSortOptions)[keyof typeof OrderSortOptions];
