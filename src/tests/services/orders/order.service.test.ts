import { PrismaClient } from '@prisma/client';
import { OrdersService } from '../../../services/orders/order.service';
import { OrderState } from '../../../dto/enums';
import { HTTPError } from '../../../errors/http-error.class';
import { Mock } from 'jest-mock';

// ... rest of the test file content remains the same ...