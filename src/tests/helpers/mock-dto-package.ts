import * as enums from '../../dto-package/src/dto/enums';
import * as global from '../../dto-package/src/dto/global';
import * as items from '../../dto-package/src/dto/items.dto';
import * as orders from '../../dto-package/src/dto/orders.dto';
import * as payment from '../../dto-package/src/dto/payment.dto';
import * as reservation from '../../dto-package/src/dto/reservation.dto';
import * as tables from '../../dto-package/src/dto/tables.dto';
import * as user from '../../dto-package/src/dto/user.dto';

jest.mock('../../dto-package', () => ({
	...enums,
	...global,
	...items,
	...orders,
	...payment,
	...reservation,
	...tables,
	...user,
}));

export { };
