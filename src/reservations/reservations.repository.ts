import { Prisma, PrismaClient, ReservationStatus } from '@prisma/client';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { HTTPError } from '../errors/http-error.class';
import { TYPES } from '../types';
import {
  ReservationCreateDto,
  ReservationDetailedDto,
  ReservationDto,
  ReservationGuestInfoDto,
  ReservationQueryDto,
  ReservationStatus as ReservationStatusDto,
  ReservationUpdateDto,
} from './dto';
import { IReservationsRepository } from './reservations.repository.interface';

const RESERVATION_INCLUDE = {
  reservationTables: {
    select: {
      id: true,
      tableNumber: true,
      table: { select: { id: true } },
    },
  },
} satisfies Prisma.ReservationInclude;

type ReservationWithTables = Prisma.ReservationGetPayload<{
  include: typeof RESERVATION_INCLUDE;
}>;

@injectable()
export class ReservationsRepository implements IReservationsRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  async findMany(criteria: ReservationQueryDto) {
    const where = this.buildWhere(criteria);
    const orderBy = {
      [criteria.sortBy]: criteria.sortOrder,
    } as Prisma.ReservationOrderByWithRelationInput;
    const [reservations, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        include: RESERVATION_INCLUDE,
        skip: (criteria.page - 1) * criteria.pageSize,
        take: criteria.pageSize,
        orderBy,
      }),
      this.prisma.reservation.count({ where }),
    ]);

    return {
      reservations: reservations.map(reservation => this.toDto(reservation)),
      total,
    };
  }

  async findById(id: number): Promise<ReservationDto | null> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: RESERVATION_INCLUDE,
    });
    return reservation ? this.toDto(reservation) : null;
  }

  async create(data: ReservationCreateDto): Promise<ReservationDetailedDto> {
    return this.prisma.$transaction(async prisma => {
      await this.validateTables(data.tables, prisma);
      const conflict = await this.findConflicts(
        data.tables,
        data.time,
        undefined,
        prisma
      );
      const reservation = await prisma.reservation.create({
        data: {
          guestsCount: data.guestsCount,
          time: data.time,
          name: data.name,
          email: data.email ?? null,
          phone: data.phone,
          status: data.status,
          comments: data.comments ?? null,
          reservationTables: {
            create: data.tables.map(tableId => ({
              table: { connect: { id: tableId } },
            })),
          },
        },
        include: RESERVATION_INCLUDE,
      });
      return { reservation: this.toDto(reservation), conflict };
    });
  }

  async update(
    id: number,
    data: ReservationUpdateDto
  ): Promise<ReservationDetailedDto> {
    return this.prisma.$transaction(async prisma => {
      const current = await prisma.reservation.findUnique({
        where: { id },
        include: RESERVATION_INCLUDE,
      });
      if (!current)
        throw new HTTPError(
          404,
          'ReservationsRepository',
          'Reservation not found'
        );

      if (data.tables !== undefined)
        await this.validateTables(data.tables, prisma);
      const tables =
        data.tables ?? current.reservationTables.map(table => table.table.id);
      const time = data.time ?? current.time;
      const conflict = await this.findConflicts(tables, time, id, prisma);
      const { tables: _, ...reservationData } = data;
      const reservation = await prisma.reservation.update({
        where: { id },
        data: {
          ...reservationData,
          ...(data.tables !== undefined && {
            reservationTables: {
              deleteMany: {},
              create: data.tables.map(tableId => ({
                table: { connect: { id: tableId } },
              })),
            },
          }),
        },
        include: RESERVATION_INCLUDE,
      });
      return { reservation: this.toDto(reservation), conflict };
    });
  }

  async updateGuestInfo(id: number, data: ReservationGuestInfoDto) {
    return this.update(id, data);
  }

  async updateStatus(id: number, status: ReservationStatusDto) {
    return this.update(id, {
      status,
      isActive:
        status !== ReservationStatus.CANCELLED &&
        status !== ReservationStatus.NO_SHOW,
    });
  }

  async updateTime(id: number, time: Date) {
    return this.update(id, { time });
  }

  async updateTables(id: number, tables: number[]) {
    return this.update(id, { tables });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.reservation.delete({ where: { id } });
  }

  private buildWhere(
    criteria: ReservationQueryDto
  ): Prisma.ReservationWhereInput {
    const guestsCount = {
      ...(criteria.guestsCount !== undefined && {
        equals: criteria.guestsCount,
      }),
      ...(criteria.guestsCountMin !== undefined && {
        gte: criteria.guestsCountMin,
      }),
      ...(criteria.guestsCountMax !== undefined && {
        lte: criteria.guestsCountMax,
      }),
    };
    const time = {
      ...(criteria.timeStart !== undefined && { gte: criteria.timeStart }),
      ...(criteria.timeEnd !== undefined && { lte: criteria.timeEnd }),
    };
    return {
      ...(criteria.name && {
        name: { contains: criteria.name, mode: 'insensitive' },
      }),
      ...(criteria.email && {
        email: { contains: criteria.email, mode: 'insensitive' },
      }),
      ...(criteria.phone && {
        phone: { contains: criteria.phone, mode: 'insensitive' },
      }),
      ...(criteria.status && { status: criteria.status }),
      ...(Object.keys(guestsCount).length > 0 && { guestsCount }),
      ...(Object.keys(time).length > 0 && { time }),
      ...(criteria.tables?.length && {
        reservationTables: { some: { table: { id: { in: criteria.tables } } } },
      }),
    };
  }

  private async validateTables(
    tableIds: number[],
    prisma: Prisma.TransactionClient
  ) {
    if (!tableIds.length) return;
    const tables = await prisma.table.findMany({
      where: { id: { in: tableIds } },
      select: { id: true },
    });
    if (tables.length !== tableIds.length) {
      throw new HTTPError(400, 'ReservationsRepository', 'Tables not found');
    }
  }

  private async findConflicts(
    tableIds: number[],
    startTime: Date,
    reservationId: number | undefined,
    prisma: Prisma.TransactionClient
  ) {
    if (!tableIds.length) return [];
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
    const reservations = await prisma.reservation.findMany({
      where: {
        ...(reservationId !== undefined && { id: { not: reservationId } }),
        isActive: true,
        time: {
          lt: endTime,
          gte: new Date(startTime.getTime() - 2 * 60 * 60 * 1000),
        },
        reservationTables: { some: { table: { id: { in: tableIds } } } },
      },
      select: {
        id: true,
        time: true,
        reservationTables: { select: { id: true, tableNumber: true } },
      },
    });
    return reservations.map(reservation => ({
      reservationId: reservation.id,
      time: reservation.time,
      tables: reservation.reservationTables,
    }));
  }

  private toDto(reservation: ReservationWithTables): ReservationDto {
    return {
      ...reservation,
      tables: reservation.reservationTables.map(({ id, tableNumber }) => ({
        id,
        tableNumber,
      })),
    };
  }
}
