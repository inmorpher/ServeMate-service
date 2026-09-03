import { inject, injectable } from 'inversify';
import { randomUUID } from 'node:crypto';
import 'reflect-metadata';
import { ILogger } from '../../logger/logger.service.interface';
import { TYPES } from '../../types';
import {
  DomainEvent,
  DomainEventHandler,
  DomainEventType,
  UserCreatedEvent,
  UserDeletedEvent,
  UserUpdatedEvent,
  WorkspaceUpdatedEvent,
} from './domain-events';

export interface IEventBus {
  publish<TEvent extends DomainEvent>(event: TEvent): Promise<void>;
  subscribe<TType extends DomainEventType>(
    type: TType,
    handler: DomainEventHandler<Extract<DomainEvent, { type: TType }>>
  ): () => void;
}

@injectable()
export class EventBus implements IEventBus {
  private readonly handlers = new Map<
    DomainEventType,
    Set<DomainEventHandler>
  >();

  constructor(@inject(TYPES.ILogger) private readonly logger: ILogger) {}

  async publish<TEvent extends DomainEvent>(event: TEvent): Promise<void> {
    const handlers = this.handlers.get(event.type);

    if (!handlers) {
      return;
    }

    await Promise.all(
      [...handlers].map(async handler => {
        try {
          await handler(event);
        } catch (error) {
          this.logger.error(
            `Event handler failed for ${event.type} (${event.eventId})`,
            error
          );
        }
      })
    );
  }

  subscribe<TType extends DomainEventType>(
    type: TType,
    handler: DomainEventHandler<Extract<DomainEvent, { type: TType }>>
  ): () => void {
    const handlers = this.handlers.get(type) ?? new Set<DomainEventHandler>();
    handlers.add(handler as DomainEventHandler);
    this.handlers.set(type, handlers);

    return () => {
      handlers.delete(handler as DomainEventHandler);
      if (handlers.size === 0) {
        this.handlers.delete(type);
      }
    };
  }

  static createWorkspaceUpdatedEvent(
    userId: number,
    version: number,
    updatedAt: string
  ): WorkspaceUpdatedEvent {
    return {
      type: 'workspace.updated',
      eventId: randomUUID(),
      occurredAt: new Date(),
      scope: { userId },
      data: { userId, version, updatedAt },
    };
  }

  static createUserCreatedEvent(
    userId: number,
    role: UserCreatedEvent['data']['role']
  ): UserCreatedEvent {
    return {
      type: 'user.created',
      eventId: randomUUID(),
      occurredAt: new Date(),
      scope: { userId },
      data: { userId, role },
    };
  }

  static createUserUpdatedEvent(
    userId: number,
    changes: string[]
  ): UserUpdatedEvent {
    return {
      type: 'user.updated',
      eventId: randomUUID(),
      occurredAt: new Date(),
      scope: { userId },
      data: { userId, changes },
    };
  }

  static createUserDeletedEvent(userId: number): UserDeletedEvent {
    return {
      type: 'user.deleted',
      eventId: randomUUID(),
      occurredAt: new Date(),
      scope: { userId },
      data: { userId },
    };
  }
}
