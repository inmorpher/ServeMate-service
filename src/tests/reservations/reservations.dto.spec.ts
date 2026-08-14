import { ReservationStatus } from '@prisma/client';
import {
  ReservationCreateSchema,
  ReservationQuerySchema,
} from '../../reservations/dto';

describe('Reservation DTOs', () => {
  it('normalizes status and defaults tables', () => {
    const value = ReservationCreateSchema.parse({
      guestsCount: '2',
      time: '2025-01-01T18:00:00.000Z',
      name: 'Alex',
      phone: '+10000000000',
      status: 'pending',
    });
    expect(value.status).toBe(ReservationStatus.PENDING);
    expect(value.tables).toEqual([]);
  });

  it('applies query defaults and validates email', () => {
    expect(ReservationQuerySchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 10,
      sortBy: 'time',
      sortOrder: 'asc',
    });
    expect(() =>
      ReservationCreateSchema.parse({
        guestsCount: 2,
        time: new Date(),
        name: 'Alex',
        phone: '1',
        email: 'invalid',
      })
    ).toThrow();
  });
});
