# 📌 Event-Driven Architecture для ServeMate

## 🎯 Обзор

Модульный монолит с Event Bus паттерном. События связывают разные сервисы без прямых зависимостей.

```
Service A создает событие
         ↓
    EventBus.publish()
         ↓
    Service B слушает
         ↓
    Обновляет свое состояние
```

---

## 📋 ORDERS Events (8 событий)

### 1. `order:created`
**Когда:** Создан новый заказ  
**Источник:** OrdersService.createOrder()  
**Слушатели:** TableService, WebSocketService, Analytics  

```typescript
interface OrderCreatedEvent {
  type: 'order:created';
  data: {
    orderId: number;
    tableNumber: number;
    guestsCount: number;
    serverId: number;
    totalAmount: number;
    orderTime: Date;
  };
  timestamp: Date;
}
```

**Действия:**
- TableService: пометить столик как occupied
- WebSocketService: отправить уведомление всем клиентам
- Analytics: залогировать событие

---

### 2. `order:status_changed`
**Когда:** Статус заказа изменился  
**Источник:** OrdersService.updateOrderProperties()  
**Слушатели:** TableService, PaymentService, WebSocketService  

```typescript
interface OrderStatusChangedEvent {
  type: 'order:status_changed';
  data: {
    orderId: number;
    tableNumber: number;
    oldStatus: OrderState;
    newStatus: OrderState;
    completionTime?: Date;
  };
  timestamp: Date;
}
```

**Действия по статусам:**
- COMPLETED или DISPUTED → освободить столик (table:freed)
- READY_TO_PAY → готов к оплате
- SERVED → блюда подали

---

### 3. `order:deleted`
**Когда:** Заказ удален  
**Источник:** OrdersService.delete()  
**Слушатели:** TableService, Cache, WebSocketService  

```typescript
interface OrderDeletedEvent {
  type: 'order:deleted';
  data: {
    orderId: number;
    tableNumber: number;
    totalAmount: number;
  };
  timestamp: Date;
}
```

---

### 4. `order:items_added`
**Когда:** Добавлены позиции в заказ  
**Источник:** OrdersService.updateItemsInOrder()  
**Слушатели:** Cache, WebSocketService  

```typescript
interface OrderItemsAddedEvent {
  type: 'order:items_added';
  data: {
    orderId: number;
    foodItemIds: number[];
    drinkItemIds: number[];
    totalAmountDelta: number;
    newTotal: number;
  };
  timestamp: Date;
}
```

---

### 5. `order:items_removed`
**Когда:** Удалены позиции из заказа  
**Источник:** OrdersService.updateItemsInOrder()  
**Слушатели:** Cache, WebSocketService  

```typescript
interface OrderItemsRemovedEvent {
  type: 'order:items_removed';
  data: {
    orderId: number;
    itemIds: number[];
    totalAmountDelta: number;
    newTotal: number;
  };
  timestamp: Date;
}
```

---

### 6. `order:items_printed`
**Когда:** Позиции отправлены в кухню/бар  
**Источник:** OrdersService.printOrderItems()  
**Слушатели:** KitchenDisplay, WebSocketService  

```typescript
interface OrderItemsPrintedEvent {
  type: 'order:items_printed';
  data: {
    orderId: number;
    itemIds: number[];
    printedAt: Date;
  };
  timestamp: Date;
}
```

---

### 7. `order:items_fired`
**Когда:** Блюда/напитки готовы  
**Источник:** OrdersService.callOrderItems()  
**Слушатели:** WaiterAlert, WebSocketService  

```typescript
interface OrderItemsFiredEvent {
  type: 'order:items_fired';
  data: {
    orderId: number;
    itemIds: number[];
    firedAt: Date;
  };
  timestamp: Date;
}
```

---

### 8. `order:total_changed`
**Когда:** Изменилась итоговая сумма (скидка, чаевые)  
**Источник:** OrdersService.updateOrderProperties()  
**Слушатели:** PaymentService, Cache  

```typescript
interface OrderTotalChangedEvent {
  type: 'order:total_changed';
  data: {
    orderId: number;
    oldTotal: number;
    newTotal: number;
    discount: number;
    tip: number;
    reason: 'discount' | 'tip' | 'items_change';
  };
  timestamp: Date;
}
```

---

## 🪑 TABLES Events (5 событий)

### 1. `table:occupied`
**Когда:** Столик занят (создан заказ)  
**Источник:** Triggered by order:created  
**Слушатели:** UI, Cache, WebSocketService, Analytics  

```typescript
interface TableOccupiedEvent {
  type: 'table:occupied';
  data: {
    tableNumber: number;
    orderId: number;
    guestsCount: number;
    serverId: number;
  };
  timestamp: Date;
}
```

---

### 2. `table:freed`
**Когда:** Столик свободен (заказ завершен)  
**Источник:** Triggered by order:status_changed  
**Слушатели:** UI, Cache, WebSocketService, UserService (reassign)  

```typescript
interface TableFreedEvent {
  type: 'table:freed';
  data: {
    tableNumber: number;
    orderId: number;
    totalTime: number; // в минутах
  };
  timestamp: Date;
}
```

---

### 3. `table:assigned`
**Когда:** Столик назначен официанту  
**Источник:** TableService.assignTable() или via Reservation  
**Слушатели:** UI, Cache, WebSocketService  

```typescript
interface TableAssignedEvent {
  type: 'table:assigned';
  data: {
    tableNumber: number;
    serverId: number;
    isPrimary: boolean;
  };
  timestamp: Date;
}
```

---

### 4. `table:unassigned`
**Когда:** Официант убран со столика  
**Источник:** TableService.unassignTable()  
**Слушатели:** UI, Cache, WebSocketService  

```typescript
interface TableUnassignedEvent {
  type: 'table:unassigned';
  data: {
    tableNumber: number;
    serverId: number;
  };
  timestamp: Date;
}
```

---

### 5. `table:status_changed`
**Когда:** Статус столика изменился (AVAILABLE → MAINTENANCE и т.д.)  
**Источник:** TableService.updateStatus()  
**Слушатели:** UI, Cache, WebSocketService  

```typescript
interface TableStatusChangedEvent {
  type: 'table:status_changed';
  data: {
    tableNumber: number;
    oldStatus: TableCondition;
    newStatus: TableCondition;
  };
  timestamp: Date;
}
```

---

## 💰 PAYMENTS Events (7 событий)

### 1. `payment:created`
**Когда:** Платеж создан  
**Источник:** PaymentService.createPayment()  
**Слушатели:** OrdersService, WebSocketService  

```typescript
interface PaymentCreatedEvent {
  type: 'payment:created';
  data: {
    paymentId: number;
    orderId: number;
    amount: number;
    tax: number;
    tip: number;
    serviceCharge: number;
    totalAmount: number;
    paymentType: PaymentMethod;
  };
  timestamp: Date;
}
```

---

### 2. `payment:completed`
**Когда:** Платеж успешно обработан  
**Источник:** PaymentService.completePayment()  
**Слушатели:** OrdersService, TableService, WebSocketService, Analytics  

```typescript
interface PaymentCompletedEvent {
  type: 'payment:completed';
  data: {
    paymentId: number;
    orderId: number;
    amount: number;
    paymentType: PaymentMethod;
    completedAt: Date;
  };
  timestamp: Date;
}
```

**Действия:**
- OrdersService: изменить статус на READY_TO_PAY
- TableService: освободить столик (если не освобожден)

---

### 3. `payment:failed`
**Когда:** Платеж не прошел  
**Источник:** PaymentService.failPayment()  
**Слушатели:** OrdersService, AlertService, WebSocketService  

```typescript
interface PaymentFailedEvent {
  type: 'payment:failed';
  data: {
    paymentId: number;
    orderId: number;
    reason: string;
    amount: number;
  };
  timestamp: Date;
}
```

---

### 4. `payment:cancelled`
**Когда:** Платеж отменен  
**Источник:** PaymentService.cancelPayment()  
**Слушатели:** OrdersService, WebSocketService  

```typescript
interface PaymentCancelledEvent {
  type: 'payment:cancelled';
  data: {
    paymentId: number;
    orderId: number;
    reason: string;
    amount: number;
  };
  timestamp: Date;
}
```

---

### 5. `refund:requested`
**Когда:** Запрос на возврат средств  
**Источник:** PaymentService.requestRefund()  
**Слушатели:** ApprovalService, NotificationService, WebSocketService  

```typescript
interface RefundRequestedEvent {
  type: 'refund:requested';
  data: {
    refundId: number;
    paymentId: number;
    orderId: number;
    amount: number;
    reason: string;
    requestedBy: number; // userId
  };
  timestamp: Date;
}
```

---

### 6. `refund:completed`
**Когда:** Возврат средств завершен  
**Источник:** PaymentService.completeRefund()  
**Слушатели:** OrdersService, WebSocketService, Analytics  

```typescript
interface RefundCompletedEvent {
  type: 'refund:completed';
  data: {
    refundId: number;
    paymentId: number;
    orderId: number;
    amount: number;
    completedAt: Date;
  };
  timestamp: Date;
}
```

---

### 7. `refund:failed`
**Когда:** Возврат не прошел  
**Источник:** PaymentService.failRefund()  
**Слушатели:** AlertService, WebSocketService  

```typescript
interface RefundFailedEvent {
  type: 'refund:failed';
  data: {
    refundId: number;
    paymentId: number;
    reason: string;
    amount: number;
  };
  timestamp: Date;
}
```

---

## 📅 RESERVATIONS Events (5 событий)

### 1. `reservation:created`
**Когда:** Бронирование создано  
**Источник:** ReservationService.createReservation()  
**Слушатели:** TableService, NotificationService, WebSocketService  

```typescript
interface ReservationCreatedEvent {
  type: 'reservation:created';
  data: {
    reservationId: number;
    tableNumbers: number[];
    guestsCount: number;
    reservationTime: Date;
    guestName: string;
    guestPhone: string;
    guestEmail?: string;
  };
  timestamp: Date;
}
```

---

### 2. `reservation:confirmed`
**Когда:** Бронирование подтверждено  
**Источник:** ReservationService.updateReservationStatus()  
**Слушатели:** TableService, NotificationService, WebSocketService  

```typescript
interface ReservationConfirmedEvent {
  type: 'reservation:confirmed';
  data: {
    reservationId: number;
    tableNumbers: number[];
  };
  timestamp: Date;
}
```

---

### 3. `reservation:cancelled`
**Когда:** Бронирование отменено  
**Источник:** ReservationService.deleteReservation()  
**Слушатели:** TableService, NotificationService, WebSocketService  

```typescript
interface ReservationCancelledEvent {
  type: 'reservation:cancelled';
  data: {
    reservationId: number;
    tableNumbers: number[];
    reason?: string;
  };
  timestamp: Date;
}
```

---

### 4. `reservation:completed`
**Когда:** Гость пришел и заказ завершен  
**Источник:** Triggered by order:status_changed or manual  
**Слушатели:** Analytics, NotificationService, WebSocketService  

```typescript
interface ReservationCompletedEvent {
  type: 'reservation:completed';
  data: {
    reservationId: number;
    orderId: number;
    totalSpent: number;
  };
  timestamp: Date;
}
```

---

### 5. `reservation:no_show`
**Когда:** Гость не пришел  
**Источник:** ReservationService.markNoShow()  
**Слушатели:** TableService, Analytics, NotificationService  

```typescript
interface ReservationNoShowEvent {
  type: 'reservation:no_show';
  data: {
    reservationId: number;
    tableNumbers: number[];
    missedAt: Date;
  };
  timestamp: Date;
}
```

---

## 👤 USERS Events (6 событий)

### 1. `user:created`
**Когда:** Создан новый пользователь  
**Источник:** UserService.createUser()  
**Слушатели:** NotificationService, WebSocketService, AuditService  

```typescript
interface UserCreatedEvent {
  type: 'user:created';
  data: {
    userId: number;
    name: string;
    email: string;
    role: UserRole;
  };
  timestamp: Date;
}
```

---

### 2. `user:updated`
**Когда:** Профиль обновлен  
**Источник:** UserService.updateUser()  
**Слушатели:** WebSocketService, CacheService, AuditService  

```typescript
interface UserUpdatedEvent {
  type: 'user:updated';
  data: {
    userId: number;
    changes: Record<string, any>;
  };
  timestamp: Date;
}
```

---

### 3. `user:deleted`
**Когда:** Пользователь удален  
**Источник:** UserService.deleteUser()  
**Слушатели:** TableService, OrdersService, WebSocketService, AuditService  

```typescript
interface UserDeletedEvent {
  type: 'user:deleted';
  data: {
    userId: number;
    reassignTableNumbers: number[];
  };
  timestamp: Date;
}
```

---

### 4. `user:login`
**Когда:** Пользователь вошел в систему  
**Источник:** AuthController.login()  
**Слушатели:** SecurityService, AnalyticsService, WebSocketService  

```typescript
interface UserLoginEvent {
  type: 'user:login';
  data: {
    userId: number;
    email: string;
    role: UserRole;
    ipAddress: string;
    userAgent: string;
  };
  timestamp: Date;
}
```

---

### 5. `user:logout`
**Когда:** Пользователь вышел из системы  
**Источник:** AuthController.logout()  
**Слушатели:** TableService, OrdersService, WebSocketService  

```typescript
interface UserLogoutEvent {
  type: 'user:logout';
  data: {
    userId: number;
    reassignTableNumbers: number[];
  };
  timestamp: Date;
}
```

---

### 6. `user:password_changed`
**Когда:** Пароль изменен  
**Источник:** UserService.changePassword()  
**Слушатели:** SecurityService, AuditService  

```typescript
interface UserPasswordChangedEvent {
  type: 'user:password_changed';
  data: {
    userId: number;
    changedAt: Date;
  };
  timestamp: Date;
}
```

---

## 🍽️ MENU Events (8 событий)

### 1. `food:created`
**Когда:** Блюдо добавлено в меню  
**Источник:** FoodItemsService.createFoodItem()  
**Слушатели:** MenuCacheService, WebSocketService  

```typescript
interface FoodCreatedEvent {
  type: 'food:created';
  data: {
    foodId: number;
    name: string;
    price: number;
    category: FoodCategory;
    preparationTime: number;
  };
  timestamp: Date;
}
```

---

### 2. `food:updated`
**Когда:** Блюдо обновлено  
**Источник:** FoodItemsService.updateFoodItem()  
**Слушатели:** MenuCacheService, WebSocketService  

```typescript
interface FoodUpdatedEvent {
  type: 'food:updated';
  data: {
    foodId: number;
    changes: Record<string, any>;
  };
  timestamp: Date;
}
```

---

### 3. `food:deleted`
**Когда:** Блюдо удалено  
**Источник:** FoodItemsService.deleteFoodItem()  
**Слушатели:** MenuCacheService, WebSocketService, OrdersService  

```typescript
interface FoodDeletedEvent {
  type: 'food:deleted';
  data: {
    foodId: number;
    name: string;
  };
  timestamp: Date;
}
```

---

### 4. `food:availability_changed`
**Когда:** Блюдо стало доступным/недоступным  
**Источник:** FoodItemsService.updateAvailability()  
**Слушатели:** MenuCacheService, KitchenDisplay, WebSocketService  

```typescript
interface FoodAvailabilityChangedEvent {
  type: 'food:availability_changed';
  data: {
    foodId: number;
    isAvailable: boolean;
    reason?: string;
  };
  timestamp: Date;
}
```

---

### 5. `drink:created`
**Когда:** Напиток добавлен  
**Источник:** DrinkItemsService.createDrinkItem()  
**Слушатели:** MenuCacheService, WebSocketService  

```typescript
interface DrinkCreatedEvent {
  type: 'drink:created';
  data: {
    drinkId: number;
    name: string;
    price: number;
    category: DrinkCategory;
    volume: number;
  };
  timestamp: Date;
}
```

---

### 6. `drink:updated`
**Когда:** Напиток обновлен  
**Источник:** DrinkItemsService.updateDrinkItem()  
**Слушатели:** MenuCacheService, WebSocketService  

```typescript
interface DrinkUpdatedEvent {
  type: 'drink:updated';
  data: {
    drinkId: number;
    changes: Record<string, any>;
  };
  timestamp: Date;
}
```

---

### 7. `drink:deleted`
**Когда:** Напиток удален  
**Источник:** DrinkItemsService.deleteDrinkItem()  
**Слушатели:** MenuCacheService, WebSocketService  

```typescript
interface DrinkDeletedEvent {
  type: 'drink:deleted';
  data: {
    drinkId: number;
    name: string;
  };
  timestamp: Date;
}
```

---

### 8. `drink:availability_changed`
**Когда:** Напиток стал доступным/недоступным  
**Источник:** DrinkItemsService.updateAvailability()  
**Слушатели:** MenuCacheService, BarDisplay, WebSocketService  

```typescript
interface DrinkAvailabilityChangedEvent {
  type: 'drink:availability_changed';
  data: {
    drinkId: number;
    isAvailable: boolean;
    reason?: string;
  };
  timestamp: Date;
}
```

---

## 🔗 Critical Event Chains

### Создание и завершение заказа:
```
order:created
├─> table:occupied
├─> Notify clients via WebSocket
└─> Update menu cache (food/drink availability)

[Order processing...]

order:status_changed (to COMPLETED)
├─> table:freed
├─> Reassign tables if server offline
└─> Trigger analytics
```

### Процесс оплаты:
```
payment:created
├─> order:status_changed (to PENDING)
└─> Alert staff

payment:completed
├─> order:status_changed
└─> table:freed (if needed)

OR

payment:failed
└─> Alert staff (retry available)
```

### Бронирование:
```
reservation:created
├─> table:assigned (зарезервировать столик)
└─> Send confirmation SMS/Email

[When guest arrives]

reservation:confirmed
└─> Open for orders

[After order completed]

reservation:completed
└─> Analytics
```

---

## 📊 Приоритет реализации

### 🔴 **Tier 1 - CRITICAL** (Реализовать первым)
- [x] EventBusService (сам сервис)
- [ ] order:created
- [ ] order:status_changed
- [ ] table:occupied
- [ ] table:freed
- [ ] payment:completed

### 🟠 **Tier 2 - IMPORTANT** (Реализовать вторым)
- [ ] order:items_printed
- [ ] order:items_fired
- [ ] payment:failed
- [ ] reservation:created
- [ ] user:login / user:logout

### 🟡 **Tier 3 - NICE TO HAVE** (Потом)
- [ ] Все остальные события
- [ ] Event persistence (логирование в БД)
- [ ] Event replay механика
- [ ] Dead letter queue для failed events

---

## 📝 Notes для реализации

1. **EventBus должен быть Singleton** - один экземпляр на все приложение
2. **Async handlers** - обработчики должны быть асинхронными
3. **Error handling** - падение одного обработчика не должно влиять на остальные
4. **Logging** - логируй все события и их обработчиков
5. **Testing** - мокируй EventBus в unit тестах
6. **Validation** - валидируй структуру события перед публикацией

---

## 🚀 Как использовать

Будет реализовано в следующих файлах:
- `src/services/events/event-bus.service.ts` - сам EventBus
- `src/services/events/domain-events.ts` - типы всех событий
- `src/services/*/handlers/` - обработчики для каждого сервиса
