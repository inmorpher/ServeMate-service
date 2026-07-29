import { PrismaClient, Session as PrismaSession } from '@prisma/client';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../types';
import { IAuthRepository } from './auth.repository.interface';
import { Session } from './entities/session.entity';

@injectable()
export class AuthRepository implements IAuthRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  async findByJti(jti: string): Promise<Session | null> {
    const raw = await this.prisma.session.findUnique({
      where: {
        refreshJti: jti,
      },
    });

    return raw ? this.toEntity(raw) : null;
  }

  async findActiveByUser(userId: number): Promise<Session[]> {
    const raws = await this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    return raws.map(r => this.toEntity(r));
  }

  async save(session: Session): Promise<void> {
    await this.prisma.session.upsert({
      where: { id: session.id },
      update: {
        userId: session.userId,
        refreshJti: session.refreshJti,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAtDate,
      },
      create: {
        id: session.id,
        userId: session.userId,
        refreshJti: session.refreshJti,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAtDate,
        createdAt: session.createdAt,
      },
    });
  }

  private toEntity(raw: PrismaSession): Session {
    return new Session(
      raw.id,
      raw.userId,
      raw.refreshJti,
      raw.expiresAt,
      raw.ipAddress,
      raw.userAgent,
      raw.revokedAt,
      raw.createdAt
    );
  }
}
