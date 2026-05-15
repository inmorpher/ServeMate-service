# ServeMate Service - Complete Project Context

**Project Name:** ServeMate Service  
**Type:** Restaurant Management Backend API  
**Language:** TypeScript  
**Framework:** Express.js + Inversify (IoC Container)  
**Database:** PostgreSQL + Prisma ORM  
**Version:** 1.0.0  
**Author:** inmo  

---

## 1. PROJECT OVERVIEW

ServeMate is a comprehensive restaurant management system backend API built with modern TypeScript and Node.js. It handles orders, payments, tables, reservations, food/drink items, and user management for restaurant operations.

### Core Responsibilities
- User authentication and authorization (JWT-based)
- Order management (creation, updates, status tracking)
- Payment processing and refunds
- Table management and assignments
- Reservation handling
- Food and beverage item catalog management
- Server action logging and audit trails

---

## 2. TECHNOLOGY STACK

### Runtime & Framework
- **Node.js** with **TypeScript** (v5.7.2)
- **Express.js** (v4.21.0) - Web framework
- **Inversify** (v6.0.2) - IoC/DI container for dependency injection

### Database
- **PostgreSQL** - Primary database
- **Prisma Client** (v7.0.0) - ORM for database access
- **Prisma Adapter PG** (@prisma/adapter-pg) - PostgreSQL adapter
- **node-cache** (v5.1.2) - In-memory caching

### Authentication & Security
- **JWT** (jsonwebtoken v9.0.2) - Token-based authentication
- **bcrypt** (v5.1.1) - Password hashing
- **cookie-parser** (v1.4.7) - Cookie handling

### Validation & Type Safety
- **Zod** (v3.23.8) - Schema validation and type inference
- **@servemate/dto** (workspace package) - Shared DTO types

### Development & Testing
- **Jest** (v29.7.0) - Testing framework
- **ts-jest** (v29.2.5) - TypeScript support for Jest
- **ts-node** (v10.9.2) - Direct TypeScript execution
- **Nodemon** (v3.1.4) - Auto-reload development server
- **Prettier** (v3.5.2) - Code formatting
- **ESLint** (v9.21.0) - Linting

### Monitoring & Observability
- **OpenTelemetry** - Distributed tracing (SDK, API, OTLP HTTP exporter)
- **@faker-js/faker** (v9.0.3) - Data generation for testing

### Process Management
- **PM2** - Production process manager (via scripts)

---

## 3. PROJECT STRUCTURE

```
/home/inmo/ServeMate-service/
├── main.ts                     # Application entry point with IoC container setup
├── env.ts                      # Environment variables validation (Zod schema)
├── app.ts                      # Express app configuration and middleware setup
├── types.ts                    # Dependency injection type symbols
├── metrics.ts                  # Application metrics
├── package.json                # Project dependencies
├── tsconfig.json               # TypeScript configuration
├── jest.config.js              # Jest testing configuration
├── nodemon.json                # Nodemon watch configuration
├── ecosystem.config.js         # PM2 cluster configuration
├── docker-compose.yml          # Production Docker Compose
├── docker-compose.dev.yml      # Development Docker Compose
├── Dockerfile                  # Production Docker image
├── Dockerfile.dev              # Development Docker image
├── prisma/
│   ├── schema.prisma           # Database schema definition (all models, enums, relations)
│   ├── prisma.config.ts        # Prisma client configuration
│   └── migrations/             # Database migrations (20+ migrations)
├── dto-package/                # Shared DTO package
│   ├── src/dto/                # DTO definitions and schemas
│   └── tests/                  # DTO tests
├── src/
│   ├── app.ts                  # Express application class
│   ├── types.ts                # DI type symbols and Express augmentation
│   ├── controllers/            # HTTP request handlers
│   │   ├── auth/               # Authentication endpoints
│   │   ├── users/              # User management endpoints
│   │   ├── tables/             # Table management endpoints
│   │   ├── orders/             # Order management endpoints
│   │   ├── payments/           # Payment processing endpoints
│   │   ├── reservations/       # Reservation management endpoints
│   │   ├── foodItems/          # Food item catalog endpoints
│   │   └── drinkItems/         # Drink item catalog endpoints
│   ├── services/               # Business logic layer
│   │   ├── users/              # User service
│   │   ├── orders/             # Order service
│   │   ├── payment/            # Payment service
│   │   ├── tables/             # Table service
│   │   ├── reservations/       # Reservation service
│   │   ├── food/               # Food items service
│   │   ├── drinks/             # Drink items service
│   │   ├── tokens/             # JWT token service
│   │   └── logger/             # Logging service
│   ├── middleware/             # Express middleware
│   │   ├── auth/               # JWT authentication middleware
│   │   ├── role/               # Role-based authorization middleware
│   │   ├── validate/           # Schema validation middleware (Zod)
│   │   └── cache/              # Caching middleware
│   ├── decorators/             # Custom decorators
│   │   └── httpDecorators.ts   # HTTP method decorators (@Get, @Post, etc.)
│   ├── errors/                 # Error handling
│   │   ├── exception.filter.ts # Global exception handler
│   │   └── custom errors       # Custom error classes
│   ├── common/                 # Shared/base classes
│   │   ├── base.controller.ts  # Base controller class
│   │   ├── base.service.ts     # Base service class
│   │   ├── base.repository.ts  # Base repository pattern
│   │   └── interfaces/         # Common interfaces
│   ├── utils/                  # Utility functions
│   ├── scripts/                # Data generation and migration scripts
│   │   ├── addUsers.ts         # Generate test users
│   │   ├── addOrders.ts        # Generate test orders
│   │   ├── addTables.ts        # Generate test tables
│   │   ├── addFoodAndDrinks.ts # Generate food/drink items
│   │   └── generateDto.ts      # Generate DTOs from schema
│   └── tests/                  # Unit and integration tests
├── coverage/                   # Jest coverage reports
└── logs/                       # Application logs
```

---

## 4. DATABASE SCHEMA (Prisma Models)

### Core Models

#### **User**
```
- id (Int) - Primary key (auto-increment)
- name (String) - User name
- email (String) - Unique email
- password (String) - Hashed password (bcrypt)
- role (UserRole) - ADMIN | USER | HOST | MANAGER
- createdAt (DateTime) - Account creation timestamp
- updatedAt (DateTime) - Last update timestamp
- isActive (Boolean) - Account active status
- lastLogin (DateTime) - Last login timestamp
- orders (Order[]) - One-to-many: orders created by this user
- TableAssignment[] - Servers assigned to tables
- userActions (orderServerAction[]) - Server action log
```

#### **Order**
```
- id (Int) - Primary key (auto-increment)
- tableNumber (Int) - FK to Table
- guestsCount (Int) - Number of guests
- orderTime (DateTime) - When order was placed
- updatedAt (DateTime) - Last update
- status (OrderState) - Order current status
- serverId (Int) - FK to User (server)
- totalAmount (Float) - Order total price
- discount (Float) - Discount applied
- tip (Float) - Tip amount
- shiftId (String) - Associated shift
- comments (String) - Special comments
- completionTime (DateTime) - When order was completed
- allergies (Allergy[]) - Allergy flags
- server (User) - Relation to server
- table (Table) - Relation to table
- drinkItems (OrderDrinkItem[]) - Ordered drinks
- foodItems (OrderFoodItem[]) - Ordered food items
- payments (Payment[]) - Order payments
- serverActions (orderServerAction[]) - Action log
- reservations (Reservation[]) - Related reservations

Indexes:
- totalAmount, status, tableNumber, serverId, orderTime, guestsCount
```

#### **OrderFoodItem**
```
- id (Int) - Primary key (auto-increment)
- orderId (Int) - FK to Order
- itemId (Int) - FK to FoodItem
- guestNumber (Int) - Which guest ordered this
- price (Float) - Price at purchase time
- specialRequest (String) - Special preparation requests
- allergies (Allergy[]) - Item allergies
- discount (Float) - Item discount
- finalPrice (Float) - Price after discount
- fired (Boolean) - Kitchen status
- printed (Boolean) - Printed to kitchen
- paymentStatus (PaymentState) - NONE | PAID | REFUNDED | CANCELLED | PENDING
- refunds (RefundPayment[]) - Refund records
- payments (Payment[]) - Payment records
- foodItem (FoodItem) - Relation to menu item
- order (Order) - Relation to order
```

#### **OrderDrinkItem**
```
Same structure as OrderFoodItem but for beverages
- id (Int)
- orderId (Int)
- itemId (Int)
- guestNumber (Int)
- price (Float)
- specialRequest (String)
- allergies (Allergy[])
- discount (Float)
- finalPrice (Float)
- fired (Boolean)
- printed (Boolean)
- paymentStatus (PaymentState)
- refunds (RefundPayment[])
- payments (Payment[])
- drinkItem (DrinkItem) - Relation to drink menu item
- order (Order)
```

#### **FoodItem**
```
- id (Int) - Primary key
- name (String) - Dish name
- price (Float) - Price
- type (FoodType) - APPETIZER | MAIN_COURSE | DESSERT | SIDES | SAUCE | OTHER
- category (FoodCategory) - SALAD | MEAT | SOUP | FISH | VEGGIES | SEAFOOD | OTHER
- allergies (Allergy[]) - Contains allergies
- ingredients (String[]) - Ingredient list
- description (String) - Dish description
- isAvailable (Boolean) - Availability
- preparationTime (Int) - Minutes to prepare
- calories (Int) - Nutritional info
- image (String) - Image URL/path
- spicyLevel (SpiceLevel) - NOT_SPICY | MILD | MEDIUM | HOT | EXTRA_HOT
- popularityScore (Float) - Popularity metric
- isVegetarian (Boolean)
- isVegan (Boolean)
- isGlutenFree (Boolean)
- createdAt (DateTime)
- updatedAt (DateTime)
- OrderFoodItem[] - Items ordered
```

#### **DrinkItem**
```
- id (Int) - Primary key
- name (String) - Drink name
- price (Float) - Price
- category (DrinkCategory) - BEER | WINE | SPIRITS | COFFEE | TEA | SODA | ALCOHOLIC | NON_ALCOHOLIC | OTHER
- description (String) - Description
- ingredients (String[]) - Ingredients
- isAvailable (Boolean)
- volume (Int) - Milliliters
- alcoholPercentage (Float) - If alcoholic
- image (String)
- isCarbonated (Boolean)
- tempriture (DrinkTemp) - COLD | ROOM | HOT
- popularityScore (Float)
- createdAt (DateTime)
- updatedAt (DateTime)
- OrderDrinkItem[] - Items ordered
```

#### **Table**
```
- id (Int) - Primary key
- tableNumber (Int) - Unique table number
- capacity (Int) - Seating capacity
- status (TableCondition) - AVAILABLE | OCCUPIED | RESERVED | ORDERING | SERVING | PAYMENT
- additionalCapacity (Int) - Expandable capacity
- originalCapacity (Int) - Original seat count
- isOccupied (Boolean) - Current occupation status
- guests (Int) - Current guest count
- orders (Order[]) - Associated orders
- assignment (TableAssignment[]) - Server assignments
- reservations (Reservation[]) - Associated reservations
```

#### **Payment**
```
- id (Int) - Primary key
- orderId (Int) - FK to Order
- amount (Float) - Payment amount
- tax (Float) - Tax portion
- tip (Float) - Tip portion
- serviceCharge (Float) - Service fee
- totalAmount (Float) - Total to charge
- paymentType (PaymentMethod) - CASH | CREDIT_CARD | DEBIT_CARD
- status (PaymentState) - PENDING | PAID | REFUNDED | CANCELLED | NONE
- createdAt (DateTime)
- completedAt (DateTime)
- order (Order) - Relation to order
- refunds (RefundPayment[]) - Refund records
- orderDrinkItems (OrderDrinkItem[]) - Associated drink items
- orderFoodItems (OrderFoodItem[]) - Associated food items
```

#### **RefundPayment**
```
- id (Int) - Primary key
- paymentId (Int) - FK to Payment
- amount (Float) - Refund amount
- reason (String) - Refund reason
- status (RefundState) - PENDING | COMPLETED | CANCELLED
- createdAt (DateTime)
- payment (Payment)
- orderDrinkItems (OrderDrinkItem[])
- orderFoodItems (OrderFoodItem[])
```

#### **Reservation**
```
- id (Int) - Primary key
- guestsCount (Int) - Party size
- time (DateTime) - Reservation time
- name (String) - Guest name
- phone (String) - Contact phone
- email (String) - Contact email
- allergies (Allergy[]) - Guest allergies
- tables (Table[]) - Assigned tables
- status (ReservationStatus) - PENDING | CONFIRMED | CANCELLED | COMPLETED | NO_SHOW
- order (Order[]) - Associated orders
- comments (String) - Special requests
- createdAt (DateTime)
- updatedAt (DateTime)
- isActive (Boolean)
```

#### **TableAssignment**
```
- id (Int) - Primary key
- tableId (Int) - FK to Table
- serverId (Int) - FK to User
- isPrimary (Boolean) - Primary server
- assignedAt (DateTime)
- isActive (Boolean)
- server (User) - Relation
- table (Table) - Relation

Unique constraint: (tableId, serverId)
```

#### **orderServerAction**
```
- id (Int) - Primary key
- orderId (Int) - FK to Order
- serverId (Int) - FK to User
- actionType (OrderAction) - CREATE | UPDATE | ADD_ITEM | REMOVE_ITEM | CHANGE_STATUS
- actionTime (DateTime)
- details (String) - Action details
- order (Order)
- server (User)
```

### Enums

```typescript
enum UserRole {
  ADMIN, USER, HOST, MANAGER
}

enum OrderState {
  AWAITING, RECEIVED, SERVED, CANCELED, DISPUTED, READY_TO_PAY, COMPLETED
}

enum OrderAction {
  CREATE, UPDATE, ADD_ITEM, REMOVE_ITEM, CHANGE_STATUS
}

enum TableCondition {
  AVAILABLE, OCCUPIED, RESERVED, ORDERING, SERVING, PAYMENT
}

enum PaymentState {
  NONE, PAID, REFUNDED, CANCELLED, PENDING
}

enum PaymentMethod {
  CASH, CREDIT_CARD, DEBIT_CARD
}

enum RefundState {
  PENDING, COMPLETED, CANCELLED
}

enum ReservationStatus {
  PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW
}

enum SpiceLevel {
  NOT_SPICY, MILD, MEDIUM, HOT, EXTRA_HOT
}

enum FoodType {
  APPETIZER, MAIN_COURSE, DESSERT, SIDES, SAUCE, OTHER
}

enum FoodCategory {
  SALAD, MEAT, SOUP, FISH, VEGGIES, SEAFOOD, OTHER
}

enum DrinkCategory {
  BEER, WINE, SPIRITS, COFFEE, TEA, SODA, ALCOHOLIC, NON_ALCOHOLIC, OTHER
}

enum DrinkTemp {
  COLD, ROOM, HOT
}

enum Allergy {
  GLUTEN, DAIRY, EGG, PEANUT, TREENUT, FISH, SHELLFISH, SOY, SESAME, 
  CELERY, MUSTARD, LUPIN, SULPHITES, MOLLUSCS
}
```

---

## 5. ARCHITECTURE PATTERNS

### Dependency Injection (Inversify)
All major components use IoC container pattern:
```typescript
// In main.ts - Container setup
const container = new Container();
container.bind(TYPES.ILogger).to(LoggerService).inSingletonScope();
container.bind(TYPES.UserService).to(UserService).inSingletonScope();
// ...
```

### Layer Architecture
```
HTTP Request
    ↓
Controller (httpDecorators)
    ↓
Middleware (validation, auth, cache)
    ↓
Service (business logic)
    ↓
Prisma Client (database)
    ↓
PostgreSQL Database
```

### Decorator Pattern
Controllers use custom decorators for route definition:
```typescript
@Controller('/orders')
export class OrdersController extends BaseController {
  @Post('/')
  @Validate(OrderCreateSchema, 'body')
  async createOrder(req: TypedRequest<OrderCreateDTO>, res: Response) {
    // handler
  }
}
```

### Middleware Stack
1. **Global Middleware** (app.ts):
   - JSON/URL-encoded parsing
   - CORS configuration
   - Cookie parsing
   - Permission-Policy headers
   - Auth middleware (selective)

2. **Route-Level Middleware**:
   - Validation middleware (Zod schemas)
   - Cache middleware
   - Role-based authorization

3. **Error Handling**:
   - Exception filter (global error handler)
   - Error propagation via `next(error)`

---

## 6. API ENDPOINTS

### Authentication (`/api/auth`)

| Method | Path | Description | Auth Required |
|--------|------|-------------|-----------------|
| POST | `/auth/login` | User login | No |
| POST | `/auth/register` | New user registration | No |
| POST | `/auth/refresh-token` | Refresh JWT token | No |
| GET | `/auth/me` | Get current user info | Yes |

### Users (`/api/users`)

| Method | Path | Description | Auth Required |
|--------|------|-------------|-----------------|
| GET | `/users` | List all users | Yes |
| GET | `/users/:id` | Get user by ID | Yes |
| POST | `/users` | Create new user | Yes |
| PUT | `/users/:id` | Update user | Yes |
| DELETE | `/users/:id` | Delete user | Yes |

### Tables (`/api/tables`)

| Method | Path | Description | Auth Required |
|--------|------|-------------|-----------------|
| GET | `/tables` | List all tables | Yes |
| GET | `/tables/meta` | Table metadata (no auth) | No |
| GET | `/tables/:id` | Get table by ID | Yes |
| POST | `/tables` | Create table | Yes |
| PATCH | `/tables/:id` | Update table | Yes |
| DELETE | `/tables/:id` | Delete table | Yes |

### Orders (`/api/orders`)

| Method | Path | Description | Auth Required |
|--------|------|-------------|-----------------|
| GET | `/orders` | List orders with filters | Yes |
| GET | `/orders/meta` | Order metadata (no auth) | No |
| GET | `/orders/:id` | Get order by ID | Yes |
| POST | `/orders` | Create order | Yes |
| PATCH | `/orders/:id` | Update order | Yes |
| DELETE | `/orders/:id` | Delete order | Yes |
| POST | `/orders/:id/items` | Add items to order | Yes |
| DELETE | `/orders/:id/items/:itemId` | Remove item from order | Yes |

### Payments (`/api/payments`)

| Method | Path | Description | Auth Required |
|--------|------|-------------|-----------------|
| GET | `/payments` | List payments | Yes |
| GET | `/payments/meta` | Payment metadata (no auth) | No |
| GET | `/payments/:id` | Get payment by ID | Yes |
| POST | `/payments` | Create payment | Yes |
| PATCH | `/payments/:id` | Update payment status | Yes |
| POST | `/payments/:id/refund` | Create refund | Yes |

### Food Items (`/api/food-items`)

| Method | Path | Description | Auth Required |
|--------|------|-------------|-----------------|
| GET | `/food-items` | List food items | Yes |
| GET | `/food-items/meta` | Food metadata (no auth) | No |
| GET | `/food-items/:id` | Get food by ID | Yes |
| POST | `/food-items` | Create food item | Yes |
| PATCH | `/food-items/:id` | Update food item | Yes |
| DELETE | `/food-items/:id` | Delete food item | Yes |

### Drink Items (`/api/drink-items`)

| Method | Path | Description | Auth Required |
|--------|------|-------------|-----------------|
| GET | `/drink-items` | List drink items | Yes |
| GET | `/drink-items/meta` | Drink metadata (no auth) | No |
| GET | `/drink-items/:id` | Get drink by ID | Yes |
| POST | `/drink-items` | Create drink item | Yes |
| PATCH | `/drink-items/:id` | Update drink item | Yes |
| DELETE | `/drink-items/:id` | Delete drink item | Yes |

### Reservations (`/api/reservations`)

| Method | Path | Description | Auth Required |
|--------|------|-------------|-----------------|
| GET | `/reservations` | List reservations | Yes |
| GET | `/reservations/meta` | Reservation metadata (no auth) | No |
| GET | `/reservations/:id` | Get reservation by ID | Yes |
| POST | `/reservations` | Create reservation | Yes |
| PATCH | `/reservations/:id` | Update reservation | Yes |
| DELETE | `/reservations/:id` | Delete reservation | Yes |

---

## 7. ENVIRONMENT VARIABLES

```env
# Server
PORT=3000
PRODUCTION=false

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/servemate

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_REFRESH=your-refresh-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Token Cache
TOKEN_CACHE_TTL=3600000

# Logging
LOG_TO_FILE=false
```

---

## 8. KEY SERVICES

### AuthenticationController
- Handles login/register routes
- JWT token generation and validation
- Password hashing with bcrypt
- Token refresh logic

### UserService
- User CRUD operations
- Password validation and hashing
- User role management
- User search and filtering

### OrdersService
- Order lifecycle management
- Item addition/removal
- Status transitions
- Order search with complex criteria
- Order totals calculation

### PaymentService
- Payment processing
- Refund handling
- Payment status tracking
- Tax and tip calculations

### TableService
- Table availability management
- Table assignment to servers
- Table capacity management
- Table status transitions

### ReservationService
- Reservation creation and management
- Reservation status updates
- Guest allocation to tables
- Availability checking

### FoodItemsService & DrinkItemsService
- Menu item CRUD operations
- Availability management
- Category and type filtering
- Popularity scoring

### TokenService
- JWT token generation
- Token validation and decoding
- Token refresh logic
- Cache management for tokens

### LoggerService
- Application-wide logging
- Structured logging with levels
- File logging support
- Request/response logging

---

## 9. VALIDATION & ERROR HANDLING

### Validation
- Uses **Zod** schemas for runtime validation
- Validation middleware (`ValidateMiddleware`) checks request body/query/params
- DTOs generated from Prisma schema
- Schema validation happens before controller logic

Example:
```typescript
const OrderCreateSchema = z.object({
  tableNumber: z.number(),
  guestsCount: z.number(),
  serverId: z.number(),
  // ...
});

@Validate(OrderCreateSchema, 'body')
@Post('/')
async createOrder(req: TypedRequest<OrderCreateDTO>, res: Response) {}
```

### Error Handling
- Global exception filter catches all errors
- Custom error classes for specific scenarios
- Errors converted to standardized JSON responses
- Error logging via LoggerService
- HTTP status codes mapped to error types

---

## 10. AUTHENTICATION & AUTHORIZATION

### JWT Authentication
1. User logs in → JWT token generated
2. Token stored in Authorization header or cookie
3. Middleware validates token on protected routes
4. User context added to Express Request object

### Middleware Flow
```typescript
// AuthMiddleware
1. Extract token from header/cookie
2. Validate token signature
3. Decode token → get user data
4. Attach user to req.user
5. Pass to next middleware
```

### Role-Based Access
- RoleMiddleware checks user.role
- Routes restricted to specific roles (ADMIN, USER, HOST, MANAGER)

---

## 11. CACHING STRATEGY

- **In-Memory Cache** using node-cache
- CacheMiddleware applied to GET endpoints
- Cache keys by route and query parameters
- TTL configurable per route
- Cache invalidation on POST/PUT/DELETE

```typescript
private cacheMiddleware: CacheMiddleware;
constructor(...) {
  this.cacheMiddleware = new CacheMiddleware(this.cache, 'orders');
}

@Get('/meta')
@CacheMiddleware.apply() // 5 minute cache
async getOrderMeta() {}
```

---

## 12. TESTING

### Test Structure
- **Jest** framework with ts-jest preset
- Tests located in `src/tests/` and `dto-package/tests/`
- Test files: `*.test.ts`
- Coverage reports in `coverage/` directory

### Running Tests
```bash
npm run test              # Run once with coverage
npm run test-watch       # Watch mode with coverage
```

### Test Categories
- Unit tests for services
- Integration tests for controllers
- DTO validation tests
- Schema migration tests

---

## 13. SCRIPTS & DATA GENERATION

### Data Generation Scripts (in `src/scripts/`)

```bash
npm run generate-users      # Create test users
npm run generate-orders     # Create test orders
npm run generate-tables     # Create test tables
npm run generate-fnb        # Create food & drink items
npm run generate-dto        # Generate DTOs from schema
```

These use **@faker-js/faker** for realistic test data.

---

## 14. BUILD & DEPLOYMENT

### Development
```bash
npm run dev              # Start with nodemon (hot reload)
npm run build            # Compile TypeScript to dist/
npm run test             # Run tests
```

### Production
```bash
npm run build            # Compile
npm run start:prod       # Run with PM2
npm run start:cluster    # Run 4 worker processes
npm run pm2:monitor      # Monitor PM2
```

### Docker
```bash
docker-compose -f docker-compose.dev.yml up    # Development
docker-compose -f docker-compose.yml up        # Production
```

---

## 15. DATABASE MIGRATIONS

### Prisma Migrations
Stored in `prisma/migrations/` directory with timestamps.

Common operations:
```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Reset database
npx prisma migrate reset

# View data in UI
npx prisma studio
```

### Current Migrations (20+)
- Initial schema setup
- User ID sequence creation
- Relationship configurations
- Order/payment model updates
- FNB model refinements
- Schema synchronization

---

## 16. CORS & SECURITY

### CORS Configuration
```typescript
cors({
  origin: [
    'http://localhost:3000',
    'http://192.168.2.60:3000',
    'http://192.168.2.60:3002',
    'http://localhost:3002'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', ...],
  exposedHeaders: ['X-Access-Token', 'X-Refresh-Token', 'Set-Cookie']
})
```

### Security Headers
```typescript
// Permission-Policy header restricts features
res.setHeader('Permission-Policy', 'geolocation=(), microphone=(), camera=()');
```

---

## 17. LOGGING & MONITORING

### LoggerService
- Structured logging with levels: log, warn, error
- Optional file-based logging (LOG_TO_FILE env)
- Colored console output for development
- Integration with OpenTelemetry for tracing

### Metrics
- `metrics.ts` file for application metrics
- Performance tracking integration

### OpenTelemetry
- Auto-instrumentation for Node.js
- HTTP tracing via OTLP exporter
- Distributed tracing support

---

## 18. DTO PACKAGE (Workspace Package)

**Location:** `/dto-package/`

Shared data transfer objects and Zod validation schemas:
- OrderCreateDTO, OrderUpdateDTO, OrderSearchDTO
- PaymentDTO, RefundDTO
- UserDTO, TableDTO
- FoodItemDTO, DrinkItemDTO
- ReservationDTO

All DTOs have corresponding Zod schemas for validation.

---

## 19. KEY INTERFACE DEFINITIONS

### TypedRequest
```typescript
interface TypedRequest<Body, Query, Params> extends Request {
  body: Body;
  query: Query;
  params: Params;
}
```

### BaseController
```typescript
class BaseController {
  protected cache: NodeCache;
  protected ok(res: Response, data: any) {}
  protected created(res: Response, data: any) {}
  protected noContent(res: Response) {}
}
```

### BaseService
```typescript
class BaseService {
  protected prisma: PrismaClient;
  protected logger: ILogger;
}
```

---

## 20. COMMON DEVELOPMENT WORKFLOWS

### Adding a New Endpoint

1. **Update Prisma Schema** (if needed)
   ```bash
   # Edit prisma/schema.prisma
   npm run prisma migrate dev --name feature_name
   ```

2. **Create/Update DTO** in `dto-package/src/dto/`
   ```typescript
   export const MyNewDTOSchema = z.object({...});
   export type MyNewDTO = z.infer<typeof MyNewDTOSchema>;
   ```

3. **Create Service Method** in appropriate service
   ```typescript
   async myNewMethod(data: MyNewDTO): Promise<Result> {
     return this.prisma.model.create({...});
   }
   ```

4. **Add Controller Route**
   ```typescript
   @Post('/my-route')
   @Validate(MyNewDTOSchema, 'body')
   async myNewRoute(req: TypedRequest<MyNewDTO>, res: Response, next: NextFunction) {
     try {
       const result = await this.service.myNewMethod(req.body);
       this.ok(res, result);
     } catch (error) {
       next(error);
     }
   }
   ```

5. **Register in Container** (if new service/controller in main.ts)

6. **Test**
   ```bash
   npm run test
   ```

### Database Schema Changes

1. Modify `prisma/schema.prisma`
2. Run migration:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```
3. Prisma generates updated client automatically
4. DTOs regenerate from schema

---

## 21. DEBUGGING TIPS

- Enable verbose logging: Set LOG_TO_FILE=true
- Use Prisma Studio: `npx prisma studio`
- Check request/response in browser DevTools
- Use VS Code debugger with ts-node config
- Check application logs in `/logs/` directory
- Use `npm run test-watch` for development

---

## 22. PERFORMANCE CONSIDERATIONS

1. **Database Indexes**: Applied on Order model (totalAmount, status, tableNumber, serverId, orderTime, guestsCount)
2. **Caching**: In-memory cache for read-heavy endpoints
3. **Connection Pooling**: Prisma with PG adapter for PostgreSQL
4. **Pagination**: Implement in search endpoints for large datasets
5. **Query Optimization**: Avoid N+1 queries using Prisma `include`

---

## 23. IMPORTANT NOTES FOR AI AGENTS

### When Reading Code
- All routes are registered via metadata decorators
- Look in decorators/httpDecorators.ts for route definitions
- Services contain business logic, controllers are thin
- DTOs are in separate workspace package

### When Modifying Code
- Always update DTO schemas when changing request/response shapes
- Run migrations for database changes
- Update type definitions in src/types.ts if adding new DI bindings
- Run tests after changes

### When Adding Features
- Follow existing patterns (controller → service → database)
- Use dependency injection for all major components
- Add Zod validation for all user inputs
- Include proper error handling with try-catch
- Document complex logic with JSDoc comments

### When Debugging
- Check env variables in env.ts
- Verify JWT middleware bypass routes in app.ts
- Look at CORS origin whitelist for client-side issues
- Check Prisma schema for relationship integrity

---

**Last Updated:** February 2026  
**Maintained By:** inmo  
**Status:** Active Development
