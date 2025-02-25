import { PaymentSearchCriteria } from '@servemate/dto';
import { NextFunction, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { TypedRequest } from '../../common/route.interface';

export abstract class AbstractPaymentController extends BaseController {
	abstract getPayments(
		req: TypedRequest<{}, PaymentSearchCriteria, {}>,
		res: Response,
		next: NextFunction
	): Promise<any>;
}
