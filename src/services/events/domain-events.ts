import { UserRole } from '@prisma/client';

export type DomainEventType =
  | 'workspace.updated'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted';

export interface WorkspaceUpdatedEvent {
  type: 'workspace.updated';
  eventId: string;
  occurredAt: Date;
  scope: {
    userId: number;
  };
  data: {
    userId: number;
    version: number;
    updatedAt: string;
  };
}

export interface UserCreatedEvent {
  type: 'user.created';
  eventId: string;
  occurredAt: Date;
  scope: { userId: number };
  data: { userId: number; role: UserRole };
}

export interface UserUpdatedEvent {
  type: 'user.updated';
  eventId: string;
  occurredAt: Date;
  scope: { userId: number };
  data: { userId: number; changes: string[] };
}

export interface UserDeletedEvent {
  type: 'user.deleted';
  eventId: string;
  occurredAt: Date;
  scope: { userId: number };
  data: { userId: number };
}

export type DomainEvent =
  | WorkspaceUpdatedEvent
  | UserCreatedEvent
  | UserUpdatedEvent
  | UserDeletedEvent;

export type DomainEventHandler<TEvent extends DomainEvent = DomainEvent> = (
  event: TEvent
) => void | Promise<void>;
