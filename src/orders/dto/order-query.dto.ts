import { Allergy, OrderState } from '@prisma/client';
import z from 'zod';

import { OrderSortOptions } from './order-base.dto';

const parseNumberList = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => Number(item.trim()))
      .filter(Number.isInteger)
      .filter(item => item > 0);
  }

  if (Array.isArray(value)) {
    return value
      .map(item => Number(item))
      .filter(Number.isInteger)
      .filter(item => item > 0);
  }

  return undefined;
};

const parseAllergies = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim().toUpperCase())
      .filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value.map(item =>
      typeof item === 'string' ? item.toUpperCase() : item
    );
  }
  return undefined;
};

export const OrderQuerySchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  tableNumber: z.coerce.number().int().positive().optional(),
  tableNumbers: z.preprocess(
    parseNumberList,
    z.array(z.number().int().positive()).optional()
  ),
  guestsCount: z.coerce.number().int().positive().optional(),

  allergies: z.preprocess(parseAllergies, z.array(z.enum(Allergy)).optional()),

  serverId: z.coerce.number().int().positive().optional(),

  serverName: z.string().trim().min(1).optional(),

  status: z.preprocess(
    value => (typeof value === 'string' ? value.toUpperCase() : value),
    z.enum(OrderState).optional()
  ),

  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),

  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),

  page: z.coerce.number().int().positive().default(1),

  pageSize: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z
    .enum([
      OrderSortOptions.ID,
      OrderSortOptions.TABLE_NUMBER,
      OrderSortOptions.GUESTS_COUNT,
      OrderSortOptions.ORDER_TIME,
      OrderSortOptions.UPDATED_AT,
      OrderSortOptions.STATUS,
      OrderSortOptions.TOTAL_AMOUNT,
    ])
    .default(OrderSortOptions.ID),

  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type OrderQuery = z.infer<typeof OrderQuerySchema>;
export type OrderQueryParams = OrderQuery;
