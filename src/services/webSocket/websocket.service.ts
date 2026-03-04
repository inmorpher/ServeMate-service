import { inject, injectable } from 'inversify';
import WebSocket from 'ws';
import { TYPES } from '../../types';
import { ILogger } from '../logger/logger.service.interface';


export interface OrderUpdateSubscriber {
    userId: string;
    ws: WebSocket;
}

@injectable()
export class WebSocketService {
    private subscribers: Map<string, OrderUpdateSubscriber[]> = new Map();

    constructor(@inject(TYPES.ILogger) private logger: ILogger) {}

    subscribe(orderId: string, userId: string, ws: WebSocket): void {
        const key = `order:${orderId}`;

        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, []);
        }

        const subscribers = this.subscribers.get(key)!;
        const isNewSubscriber = !subscribers.some((sub) => sub.userId === userId);

        if (isNewSubscriber) {
            subscribers.push({ userId, ws });
            this.logger.log(`✓ User ${userId} subscribed to order ${orderId}`);
        }

        this.sendMessage(ws, 'SUBSCRIPTION_SUCCESS', {
            orderId,
            userId,
            activeSubscribers: subscribers.length
        });
    }

    unsubscribe(orderId: string, userId: string): void {
        const key = `order:${orderId}`;
        const subscribers = this.subscribers.get(key);

        if (subscribers) {
            const filtered = subscribers.filter((sub) => sub.userId !== userId);
            if (filtered.length === 0) {
                this.subscribers.delete(key);
            } else {
                this.subscribers.set(key, filtered);
            }
            this.logger.log(`User ${userId} unsubscribed from order ${orderId}`);
        }
    }

    // Исправлено: используем правильный ключ
    notifySubscribers(orderId: string, data: any): void {
        const key = `order:${orderId}`;
        const subscribers = this.subscribers.get(key);

        console.log(`[WebSocket] Попытка отправить сообщение для ${key}`);
    console.log(`[WebSocket] Активные ключи:`, Array.from(this.subscribers.keys()));
    console.log(`[WebSocket] Подписчики для ${key}:`, subscribers?.length || 0);

       if (subscribers && subscribers.length > 0) {
        subscribers.forEach(sub => {
            if (sub.ws.readyState === WebSocket.OPEN) {
                console.log(`[WebSocket] ✓ Отправляю сообщение пользователю ${sub.userId}`);
                this.sendMessage(sub.ws, 'orderUpdate', data);
            } else {
                console.log(`[WebSocket] ✗ Соединение закрыто для пользователя ${sub.userId}`);
            }
        });
    } else {
        console.warn(`[WebSocket] ⚠ Нет подписчиков для ${key}`);
    }
    }

    broadcastOrderCreated(data: any): void {
        this.broadcast('ORDER_CREATED', data);
    }

    broadcastOrderStatusChanged(orderId: string, status: string, data: any): void {
        this.notifySubscribers(orderId, {
            event: 'STATUS_CHANGED',
            status,
            ...data
        });
    }

    private broadcast(type: string, data: any): void {
        this.subscribers.forEach((subscribers) => {
            subscribers.forEach((sub) => {
                this.sendMessage(sub.ws, type, data);
            });
        });
    }

    private sendMessage(ws: WebSocket, type: string, data: any): void {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type, data, timestamp: new Date() }));
        }
    }

    getActiveSubscribers(orderId: string): number {
        const key = `order:${orderId}`;
        return this.subscribers.get(key)?.length || 0;
    }
}
