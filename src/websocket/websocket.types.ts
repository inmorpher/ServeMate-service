export type RealtimeResource =
  | 'orders'
  | 'users'
  | 'tables'
  | 'payments'
  | 'reservations'
  | 'food-items'
  | 'drink-items'
  | 'workspace';

export type RealtimeEvent = {
  id: string;
  type: string;
  resource: RealtimeResource;
  entityId?: string | number;
  payload?: unknown;
  occurredAt: string;
};

export function isRealtimeResource(value: string): value is RealtimeResource {
  return [
    'orders',
    'users',
    'tables',
    'payments',
    'reservations',
    'food-items',
    'drink-items',
    'workspace',
  ].includes(value);
}
