import { PaymentMethod, PaymentState } from '@prisma/client';
import { z } from 'zod';

export { PaymentMethod, PaymentState };
export const PaymentStatus = PaymentState;

export const PaymentSearchSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(PaymentState).optional(),
  orderId: z.coerce.number().int().positive().optional(),
});

export const PaymentSchema = z.object({
  id: z.number().int().positive(),
  amount: z.number(),
  tax: z.number(),
  tip: z.number(),
  serviceCharge: z.number(),
  totalAmount: z.number(),
  paymentType: z.enum(PaymentMethod),
  status: z.enum(PaymentState),
  createdAt: z.date(),
  completedAt: z.date().nullable(),
  orderId: z.number(),
});
export const PartialPaymentSchema = PaymentSchema.partial();
export const RefundSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().min(1),
});
export const PaymentSortOptions = {
  ID: 'id',
  CREATED_AT: 'createdAt',
  STATUS: 'status',
  TOTAL_AMOUNT: 'totalAmount',
} as const;

export type PaymentDTO = z.infer<typeof PaymentSchema>;
export type PaymentListDTO = {
  payments: PaymentDTO[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
export type PaymentSearchCriteria = z.infer<typeof PaymentSearchSchema>;
export type RefundDTO = z.infer<typeof RefundSchema>;
export type OrderItemDTO = {
  id: number;
  finalPrice: number;
  paymentStatus: PaymentState;
};
