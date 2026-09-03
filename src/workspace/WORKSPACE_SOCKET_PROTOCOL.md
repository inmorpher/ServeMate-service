# Workspace WebSocket Protocol

## Purpose

WebSocket сообщает другим клиентам пользователя, что сохранённое workspace-состояние изменилось. HTTP остаётся источником истины для чтения, записи и optimistic locking.

## Connection and authorization

- Клиент подключается к существующему WebSocket transport.
- Пользователь определяется из авторизованного connection context, а не из `userId` в сообщении.
- Клиент не может подписаться на workspace другого пользователя.
- Workspace channel имеет ключ `workspace:<userId>`.

## Events

### Server to client: `workspace.updated`

Отправляется после успешного `PUT /api/workspace`.

```json
{
  "type": "workspace.updated",
  "data": {
    "version": 6
  },
  "timestamp": "2026-08-20T12:00:00.000Z"
}
```

Передавать полный workspace в событии необязательно. Получив событие с более новой версией, клиент инвалидирует TanStack Query и запрашивает `/api/workspace/bootstrap` заново.

### Optional client to server: `workspace.subscribe`

Если transport использует явные подписки, payload может выглядеть так:

```json
{
  "type": "workspace.subscribe"
}
```

Подписка всегда ограничена workspace текущего пользователя.

### Server to client: `workspace.conflict`

Это событие не заменяет HTTP `409 Conflict`. Оно может использоваться для уведомления клиента о конфликте, но результат записи всегда определяется ответом `PUT`.

## Client behavior

1. Загрузить bootstrap через HTTP.
2. Хранить `workspace.version` вместе с локальным состоянием.
3. Отправлять `expectedVersion` из последнего подтверждённого ответа.
4. При `workspace.updated` и отсутствии локальных несохранённых изменений выполнить refetch.
5. При `409` получить актуальный workspace, объединить изменения или показать пользователю конфликт.
6. Не применять входящее событие поверх dirty local state автоматически.

## Version rules

- Успешное обновление увеличивает версию на единицу.
- Событие с `version <= localVersion` нужно игнорировать.
- WebSocket не выполняет запись и не отменяет проверку `expectedVersion` на HTTP endpoint.

## Current implementation boundary

Текущий WebSocket-код обслуживает подписки `order:<orderId>`. Workspace channel и событие `workspace.updated` являются следующим расширением transport. До его реализации клиент должен использовать polling или refetch после mutations.
