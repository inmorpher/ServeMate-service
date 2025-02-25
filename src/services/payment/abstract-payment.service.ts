import {
	OrderItemDTO,
	PaymentDTO,
	PaymentListDTO,
	PaymentSearchCriteria,
	PaymentStatus,
} from '@servemate/dto';
import { BaseService } from '../../common/base.service';
import { HTTPError } from '../../errors/http-error.class';

export abstract class AbstractPaymentService extends BaseService {
	abstract findPayments(criteria: PaymentSearchCriteria): Promise<PaymentListDTO>;
	abstract findPaymentById(paymentId: number): Promise<PaymentDTO>;
	abstract createPayment(
		orderId: number,
		drinkItems?: number[],
		foodItems?: number[]
	): Promise<any>;
	abstract completePayment(paymentId: number): Promise<string>; // updated parameter name
	abstract refundPayment(paymentId: number, reason: string): Promise<string>;
	abstract cancelPayment(paymentId: number): Promise<string>;

	protected calculatePaymentAmount(items: { finalPrice: number }[]): number {
		return items.reduce((sum, item) => sum + item.finalPrice, 0);
	}

	protected validateItems(
		drinkItems: number[] = [],
		foodItems: number[] = [],
		orderItems: {
			foodItems: OrderItemDTO[];
			drinkItems: OrderItemDTO[];
		}
	): { selectedDrinks: OrderItemDTO[]; selectedFoods: OrderItemDTO[] } {
		const invalidStatuses = [PaymentStatus.PAID, PaymentStatus.PENDING] as PaymentStatus[];

		const selectedDrinks = orderItems.drinkItems.filter((item) => {
			if (drinkItems.includes(item.id) && invalidStatuses.includes(item.paymentStatus)) {
				throw new HTTPError(
					400,
					'Payment Create',
					'Invalid items selected or cannot add processed items to another payment'
				);
			}
			return drinkItems.includes(item.id);
		});

		const selectedFoods = orderItems.foodItems.filter((item) => {
			if (foodItems.includes(item.id) && invalidStatuses.includes(item.paymentStatus)) {
				throw new HTTPError(
					400,
					'Payment Create',
					'Invalid items selected or cannot add processed items to another payment'
				);
			}
			return foodItems.includes(item.id);
		});

		return {
			selectedDrinks,
			selectedFoods,
		};
	}

	protected calculateTaxAndCharges(subtotal: number): {
		tax: number;
		serviceCharge: number;
		total: number;
	} {
		const tax = subtotal * 0.1;
		const serviceCharge = subtotal * 0.05;
		const total = subtotal + tax + serviceCharge;

		return {
			tax,
			serviceCharge,
			total,
		};
	}
}
