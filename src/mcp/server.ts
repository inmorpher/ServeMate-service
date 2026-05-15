import 'dotenv/config';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, type Tool } from '@modelcontextprotocol/sdk/types.js';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type ToolMetadata = {
	controller?: string;
	name: string;
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	route?: string;
	description: string;
	inputSchema: Tool['inputSchema'];
	outputSchema: JsonValue;
	exampleInput: JsonValue;
	exampleOutput: JsonValue;
};

const emptyInputSchema: Tool['inputSchema'] = {
	type: 'object',
	properties: {},
	additionalProperties: false,
};

const noContentOutputSchema = {
	type: 'null',
	description: 'No response body is returned (204 No Content).',
};

const messageOutputSchema = {
	type: 'object',
	properties: {
		message: { type: 'string' },
	},
	required: ['message'],
};

const userItemSchema = {
	type: 'object',
	properties: {
		id: { type: 'number' },
		name: { type: 'string' },
		email: { type: 'string' },
		role: { type: 'string' },
		isActive: { type: 'boolean' },
		createdAt: { type: 'string' },
		updatedAt: { type: 'string' },
		lastLogin: { type: ['string', 'null'] },
	},
};

const userListSchema = {
	type: 'object',
	properties: {
		users: { type: 'array', items: userItemSchema },
		totalCount: { type: 'number' },
		page: { type: 'number' },
		pageSize: { type: 'number' },
		totalPages: { type: 'number' },
	},
};

const tableItemSchema = {
	type: 'object',
	properties: {
		id: { type: 'number' },
		tableNumber: { type: 'number' },
		capacity: { type: 'number' },
		additionalCapacity: { type: 'number' },
		isOccupied: { type: 'boolean' },
		status: { type: 'string' },
		guests: { type: 'number' },
		originalCapacity: { type: 'number' },
	},
};

const tableListSchema = {
	type: 'object',
	properties: {
		tables: { type: 'array', items: tableItemSchema },
		totalCount: { type: 'number' },
		page: { type: 'number' },
		pageSize: { type: 'number' },
		totalPages: { type: 'number' },
	},
};

const orderListSchema = {
	type: 'object',
	properties: {
		orders: { type: 'array', items: { type: 'object' } },
		priceRange: {
			type: 'object',
			properties: {
				min: { type: 'number' },
				max: { type: 'number' },
			},
		},
		dateRange: {
			type: 'object',
			properties: {
				min: { type: 'string' },
				max: { type: 'string' },
			},
		},
		totalCount: { type: 'number' },
		page: { type: 'number' },
		pageSize: { type: 'number' },
		totalPages: { type: 'number' },
	},
};

const orderMetaSchema = {
	type: 'object',
	properties: {
		statuses: { type: 'array', items: { type: 'string' } },
		allergies: { type: 'array', items: { type: 'string' } },
		maxGuests: { type: 'number' },
		prices: {
			type: 'object',
			properties: {
				min: { type: 'number' },
				max: { type: 'number' },
			},
		},
		dates: {
			type: 'object',
			properties: {
				min: { type: 'string' },
				max: { type: 'string' },
			},
		},
		tableNumbers: { type: 'array', items: { type: 'number' } },
		filtered: {
			type: 'object',
			properties: {
				maxGuests: { type: 'number' },
				prices: {
					type: 'object',
					properties: {
						min: { type: 'number' },
						max: { type: 'number' },
					},
				},
				dates: {
					type: 'object',
					properties: {
						min: { type: 'string' },
						max: { type: 'string' },
					},
				},
				tableNumbers: { type: 'array', items: { type: 'number' } },
			},
		},
	},
};

const reservationItemSchema = {
	type: 'object',
	properties: {
		id: { type: 'number' },
		guestsCount: { type: 'number' },
		time: { type: 'string' },
		name: { type: 'string' },
		phone: { type: 'string' },
		email: { type: ['string', 'null'] },
		status: { type: 'string' },
		comments: { type: ['string', 'null'] },
		createdAt: { type: 'string' },
		updatedAt: { type: 'string' },
		isActive: { type: 'boolean' },
	},
};

const reservationListSchema = {
	type: 'object',
	properties: {
		reservations: { type: 'array', items: reservationItemSchema },
		totalCount: { type: 'number' },
		page: { type: 'number' },
		pageSize: { type: 'number' },
		totalPages: { type: 'number' },
	},
};

const paymentItemSchema = {
	type: 'object',
	properties: {
		id: { type: 'number' },
		amount: { type: 'number' },
		tax: { type: 'number' },
		tip: { type: 'number' },
		serviceCharge: { type: 'number' },
		paymentType: { type: 'string' },
		createdAt: { type: ['string', 'null'] },
		completedAt: { type: ['string', 'null'] },
		orderId: { type: 'number' },
		status: { type: 'string' },
	},
};

const paymentListSchema = {
	type: 'object',
	properties: {
		payments: { type: 'array', items: paymentItemSchema },
		totalCount: { type: 'number' },
		page: { type: 'number' },
		pageSize: { type: 'number' },
		totalPages: { type: 'number' },
	},
};

const foodItemSchema = {
	type: 'object',
	properties: {
		id: { type: 'number' },
		name: { type: 'string' },
		price: { type: 'number' },
		description: { type: 'string' },
		type: { type: 'string' },
		category: { type: 'string' },
		ingredients: { type: 'array', items: { type: 'string' } },
		isAvailable: { type: 'boolean' },
		preparationTime: { type: 'number' },
		calories: { type: ['number', 'null'] },
		image: { type: ['string', 'null'] },
		spicyLevel: { type: 'string' },
		popularityScore: { type: 'number' },
		isVegetarian: { type: 'boolean' },
		isVegan: { type: 'boolean' },
		isGlutenFree: { type: 'boolean' },
	},
};

const foodListSchema = {
	type: 'object',
	properties: {
		items: { type: 'array', items: foodItemSchema },
		totalCount: { type: 'number' },
		page: { type: 'number' },
		pageSize: { type: 'number' },
		totalPages: { type: 'number' },
	},
};

const drinkItemSchema = {
	type: 'object',
	properties: {
		id: { type: 'number' },
		name: { type: 'string' },
		price: { type: 'number' },
		description: { type: 'string' },
		category: { type: 'string' },
		ingredients: { type: 'array', items: { type: 'string' } },
		isAvailable: { type: 'boolean' },
		volume: { type: 'number' },
		alcoholPercentage: { type: ['number', 'null'] },
		image: { type: ['string', 'null'] },
		isCarbonated: { type: 'boolean' },
		tempriture: { type: 'string' },
		popularityScore: { type: 'number' },
	},
};

const drinkListSchema = {
	type: 'object',
	properties: {
		items: { type: 'array', items: drinkItemSchema },
		totalCount: { type: 'number' },
		page: { type: 'number' },
		pageSize: { type: 'number' },
		totalPages: { type: 'number' },
	},
};

const toolMetadata: ToolMetadata[] = [
	{
		name: 'project_overview',
		description: 'Returns a quick summary of the ServeMate API surface and domain areas.',
		inputSchema: { type: 'object', properties: {}, additionalProperties: false },
		outputSchema: {
			type: 'object',
			properties: {
				name: { type: 'string' },
				description: { type: 'string' },
				areas: { type: 'array', items: { type: 'string' } },
			},
		},
		exampleInput: {},
		exampleOutput: {
			name: 'ServeMate API',
			description: 'Restaurant management service.',
			areas: ['auth', 'users', 'tables', 'orders', 'reservations', 'menu', 'payments'],
		},
	},
	{
		name: 'list_users',
		description: 'Lists users with optional search and active-state filters.',
		inputSchema: {
			type: 'object',
			properties: {
				take: { type: 'number', minimum: 1, maximum: 100, default: 20 },
				skip: { type: 'number', minimum: 0, default: 0 },
				search: { type: 'string' },
				isActive: { type: 'boolean' },
			},
			additionalProperties: false,
		},
		outputSchema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'number' },
					name: { type: 'string' },
					email: { type: 'string' },
					role: { type: 'string' },
					isActive: { type: 'boolean' },
					createdAt: { type: 'string' },
					updatedAt: { type: 'string' },
					lastLogin: { type: ['string', 'null'] },
				},
			},
		},
		exampleInput: { take: 10, skip: 0, search: 'john', isActive: true },
		exampleOutput: [
			{
				id: 1,
				name: 'John Doe',
				email: 'john@example.com',
				role: 'USER',
				isActive: true,
				createdAt: '2026-01-01T10:00:00.000Z',
				updatedAt: '2026-01-01T10:00:00.000Z',
				lastLogin: null,
			},
		],
	},
	{
		name: 'get_user_by_id',
		description: 'Gets a single user by numeric id.',
		inputSchema: {
			type: 'object',
			properties: {
				id: { type: 'number', minimum: 1 },
			},
			required: ['id'],
			additionalProperties: false,
		},
		outputSchema: { type: ['object', 'null'] },
		exampleInput: { id: 1 },
		exampleOutput: {
			id: 1,
			name: 'John Doe',
			email: 'john@example.com',
			role: 'USER',
			isActive: true,
			createdAt: '2026-01-01T10:00:00.000Z',
			updatedAt: '2026-01-01T10:00:00.000Z',
			lastLogin: null,
		},
	},
	{
		name: 'list_tables',
		description: 'Lists restaurant tables with occupancy filters.',
		inputSchema: {
			type: 'object',
			properties: {
				take: { type: 'number', minimum: 1, maximum: 100, default: 20 },
				skip: { type: 'number', minimum: 0, default: 0 },
				isOccupied: { type: 'boolean' },
			},
			additionalProperties: false,
		},
		outputSchema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'number' },
					tableNumber: { type: 'number' },
					capacity: { type: 'number' },
					status: { type: 'string' },
					additionalCapacity: { type: 'number' },
					isOccupied: { type: 'boolean' },
					originalCapacity: { type: 'number' },
					guests: { type: 'number' },
				},
			},
		},
		exampleInput: { take: 10, isOccupied: false },
		exampleOutput: [
			{
				id: 1,
				tableNumber: 12,
				capacity: 4,
				status: 'AVAILABLE',
				additionalCapacity: 0,
				isOccupied: false,
				originalCapacity: 4,
				guests: 0,
			},
		],
	},
	{
		name: 'get_table_by_number',
		description: 'Gets a table by its table number.',
		inputSchema: {
			type: 'object',
			properties: {
				tableNumber: { type: 'number', minimum: 1 },
			},
			required: ['tableNumber'],
			additionalProperties: false,
		},
		outputSchema: { type: ['object', 'null'] },
		exampleInput: { tableNumber: 12 },
		exampleOutput: {
			id: 1,
			tableNumber: 12,
			capacity: 4,
			status: 'AVAILABLE',
			additionalCapacity: 0,
			isOccupied: false,
			originalCapacity: 4,
			guests: 0,
		},
	},
	{
		name: 'list_orders',
		description: 'Lists orders with optional filters for status, table, and server.',
		inputSchema: {
			type: 'object',
			properties: {
				take: { type: 'number', minimum: 1, maximum: 100, default: 20 },
				skip: { type: 'number', minimum: 0, default: 0 },
				status: { type: 'string' },
				tableNumber: { type: 'number', minimum: 1 },
				serverId: { type: 'number', minimum: 1 },
			},
			additionalProperties: false,
		},
		outputSchema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'number' },
					tableNumber: { type: 'number' },
					guestsCount: { type: 'number' },
					orderTime: { type: 'string' },
					updatedAt: { type: 'string' },
					serverId: { type: 'number' },
					totalAmount: { type: 'number' },
					status: { type: 'string' },
					comments: { type: ['string', 'null'] },
					completionTime: { type: ['string', 'null'] },
					discount: { type: 'number' },
					tip: { type: 'number' },
					shiftId: { type: ['string', 'null'] },
				},
			},
		},
		exampleInput: { take: 20, status: 'RECEIVED', serverId: 5 },
		exampleOutput: [
			{
				id: 101,
				tableNumber: 12,
				guestsCount: 4,
				orderTime: '2026-01-01T12:00:00.000Z',
				updatedAt: '2026-01-01T12:10:00.000Z',
				serverId: 5,
				totalAmount: 86.4,
				status: 'RECEIVED',
				comments: null,
				completionTime: null,
				discount: 0,
				tip: 0,
				shiftId: null,
			},
		],
	},
	{
		name: 'get_order_by_id',
		description: 'Gets a single order with nested table, server, item, and payment details.',
		inputSchema: {
			type: 'object',
			properties: {
				id: { type: 'number', minimum: 1 },
			},
			required: ['id'],
			additionalProperties: false,
		},
		outputSchema: { type: ['object', 'null'] },
		exampleInput: { id: 101 },
		exampleOutput: {
			id: 101,
			tableNumber: 12,
			guestsCount: 4,
			status: 'RECEIVED',
			table: { id: 1, tableNumber: 12, capacity: 4, status: 'AVAILABLE' },
			server: { id: 5, name: 'John Doe', email: 'john@example.com' },
		},
	},
	{
		name: 'list_reservations',
		description: 'Lists reservations with an optional status filter.',
		inputSchema: {
			type: 'object',
			properties: {
				take: { type: 'number', minimum: 1, maximum: 100, default: 20 },
				skip: { type: 'number', minimum: 0, default: 0 },
				status: { type: 'string' },
			},
			additionalProperties: false,
		},
		outputSchema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'number' },
					guestsCount: { type: 'number' },
					time: { type: 'string' },
					name: { type: 'string' },
					phone: { type: 'string' },
					email: { type: ['string', 'null'] },
					status: { type: 'string' },
					comments: { type: ['string', 'null'] },
					createdAt: { type: 'string' },
					updatedAt: { type: 'string' },
					isActive: { type: 'boolean' },
				},
			},
		},
		exampleInput: { take: 10, status: 'PENDING' },
		exampleOutput: [
			{
				id: 201,
				guestsCount: 2,
				time: '2026-01-02T18:00:00.000Z',
				name: 'Jane Doe',
				phone: '+10000000000',
				email: 'jane@example.com',
				status: 'PENDING',
				comments: null,
				createdAt: '2026-01-01T10:00:00.000Z',
				updatedAt: '2026-01-01T10:00:00.000Z',
				isActive: true,
			},
		],
	},
	{
		name: 'list_food_items',
		description: 'Lists food items with optional search and availability filters.',
		inputSchema: {
			type: 'object',
			properties: {
				take: { type: 'number', minimum: 1, maximum: 100, default: 20 },
				skip: { type: 'number', minimum: 0, default: 0 },
				search: { type: 'string' },
				isAvailable: { type: 'boolean' },
			},
			additionalProperties: false,
		},
		outputSchema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'number' },
					name: { type: 'string' },
					price: { type: 'number' },
					type: { type: 'string' },
					category: { type: 'string' },
					ingredients: { type: 'array', items: { type: 'string' } },
					description: { type: 'string' },
					isAvailable: { type: 'boolean' },
					preparationTime: { type: 'number' },
					calories: { type: ['number', 'null'] },
					image: { type: ['string', 'null'] },
					spicyLevel: { type: 'string' },
					popularityScore: { type: 'number' },
					isVegetarian: { type: 'boolean' },
					isVegan: { type: 'boolean' },
					isGlutenFree: { type: 'boolean' },
				},
			},
		},
		exampleInput: { take: 10, search: 'salad', isAvailable: true },
		exampleOutput: [
			{
				id: 301,
				name: 'Caesar Salad',
				price: 8.5,
				type: 'OTHER',
				category: 'OTHER',
				ingredients: ['lettuce', 'croutons', 'parmesan'],
				description: 'Fresh salad',
				isAvailable: true,
				preparationTime: 10,
				calories: 220,
				image: null,
				spicyLevel: 'NOT_SPICY',
				popularityScore: 0,
				isVegetarian: true,
				isVegan: false,
				isGlutenFree: false,
			},
		],
	},
	{
		name: 'list_drink_items',
		description: 'Lists drink items with optional search and availability filters.',
		inputSchema: {
			type: 'object',
			properties: {
				take: { type: 'number', minimum: 1, maximum: 100, default: 20 },
				skip: { type: 'number', minimum: 0, default: 0 },
				search: { type: 'string' },
				isAvailable: { type: 'boolean' },
			},
			additionalProperties: false,
		},
		outputSchema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'number' },
					name: { type: 'string' },
					price: { type: 'number' },
					category: { type: 'string' },
					description: { type: 'string' },
					ingredients: { type: 'array', items: { type: 'string' } },
					isAvailable: { type: 'boolean' },
					volume: { type: 'number' },
					alcoholPercentage: { type: ['number', 'null'] },
					image: { type: ['string', 'null'] },
					isCarbonated: { type: 'boolean' },
					tempriture: { type: 'string' },
					popularityScore: { type: 'number' },
				},
			},
		},
		exampleInput: { take: 10, search: 'cola' },
		exampleOutput: [
			{
				id: 401,
				name: 'Cola',
				price: 3,
				category: 'OTHER',
				description: 'Soft drink',
				ingredients: ['water', 'sugar'],
				isAvailable: true,
				volume: 330,
				alcoholPercentage: null,
				image: null,
				isCarbonated: true,
				tempriture: 'ROOM',
				popularityScore: 0,
			},
		],
	},
	{
		controller: 'auth',
		name: 'login',
		method: 'POST',
		route: '/auth/login',
		description: 'Authenticates a user and returns access and refresh tokens.',
		inputSchema: {
			type: 'object',
			properties: {
				email: { type: 'string' },
				password: { type: 'string' },
			},
			required: ['email', 'password'],
			additionalProperties: false,
		},
		outputSchema: {
			type: 'object',
			properties: {
				user: userItemSchema,
				accessToken: { type: 'string' },
				refreshToken: { type: 'string' },
				expiresIn: { type: 'string' },
			},
		},
		exampleInput: { email: 'john@example.com', password: 'secret' },
		exampleOutput: {
			user: {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com',
				role: 'USER',
				isActive: true,
				createdAt: '2026-01-01T10:00:00.000Z',
				updatedAt: '2026-01-01T10:00:00.000Z',
				lastLogin: '2026-01-01T12:00:00.000Z',
			},
			accessToken: 'eyJhbGciOi...',
			refreshToken: 'eyJhbGciOi...',
			expiresIn: '1h',
		},
	},
	{
		controller: 'auth',
		name: 'logout',
		method: 'POST',
		route: '/auth/logout',
		description: 'Clears the refresh token cookie and logs the user out.',
		inputSchema: emptyInputSchema,
		outputSchema: messageOutputSchema,
		exampleInput: {},
		exampleOutput: { message: 'Logged out successfully' },
	},
	{
		controller: 'auth',
		name: 'refresh_token',
		method: 'POST',
		route: '/auth/refresh-token',
		description: 'Exchanges a refresh token for a new token bundle.',
		inputSchema: {
			type: 'object',
			properties: {
				refreshToken: { type: 'string' },
			},
			required: ['refreshToken'],
			additionalProperties: false,
		},
		outputSchema: {
			type: 'object',
			properties: {
				accessToken: { type: 'string' },
				refreshToken: { type: 'string' },
				expiresIn: { type: 'string' },
			},
		},
		exampleInput: { refreshToken: 'eyJhbGciOi...' },
		exampleOutput: { accessToken: 'eyJhbGciOi...', refreshToken: 'eyJhbGciOi...', expiresIn: '1h' },
	},
	{
		controller: 'auth',
		name: 'me',
		method: 'GET',
		route: '/auth/me',
		description: 'Returns the currently authenticated user.',
		inputSchema: emptyInputSchema,
		outputSchema: {
			type: 'object',
			properties: { user: userItemSchema },
		},
		exampleInput: {},
		exampleOutput: {
			user: {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com',
				role: 'USER',
				isActive: true,
				createdAt: '2026-01-01T10:00:00.000Z',
				updatedAt: '2026-01-01T10:00:00.000Z',
				lastLogin: null,
			},
		},
	},
	{
		controller: 'users',
		name: 'create_user',
		method: 'POST',
		route: '/users',
		description: 'Creates a new user account.',
		inputSchema: {
			type: 'object',
			properties: {
				name: { type: 'string' },
				email: { type: 'string' },
				role: { type: 'string' },
				password: { type: 'string' },
			},
			required: ['name', 'email', 'role', 'password'],
			additionalProperties: false,
		},
		outputSchema: { type: 'string' },
		exampleInput: { name: 'Jane Doe', email: 'jane@example.com', role: 'USER', password: 'secret' },
		exampleOutput: 'User JANE DOE jane@example.com created successfully',
	},
	{
		controller: 'users',
		name: 'update_user',
		method: 'PUT',
		route: '/users/:id',
		description: 'Updates a user by id.',
		inputSchema: {
			type: 'object',
			properties: {
				id: { type: 'number', minimum: 1 },
				name: { type: 'string' },
				email: { type: 'string' },
				role: { type: 'string' },
				isActive: { type: 'boolean' },
			},
			required: ['id'],
			additionalProperties: true,
		},
		outputSchema: { type: 'string' },
		exampleInput: { id: 1, name: 'John Updated', isActive: false },
		exampleOutput: 'User with ID 1 updated successfully',
	},
	{
		controller: 'users',
		name: 'delete_user',
		method: 'DELETE',
		route: '/users/:id',
		description: 'Deletes a user by id.',
		inputSchema: {
			type: 'object',
			properties: { id: { type: 'number', minimum: 1 } },
			required: ['id'],
			additionalProperties: false,
		},
		outputSchema: { type: 'string' },
		exampleInput: { id: 1 },
		exampleOutput: 'User with ID 1 deleted successfully',
	},
	{
		controller: 'tables',
		name: 'create_table',
		method: 'POST',
		route: '/tables',
		description: 'Creates a new table.',
		inputSchema: {
			type: 'object',
			properties: {
				tableNumber: { type: 'number' },
				capacity: { type: 'number' },
			},
			required: ['tableNumber', 'capacity'],
			additionalProperties: false,
		},
		outputSchema: { type: 'string' },
		exampleInput: { tableNumber: 24, capacity: 4 },
		exampleOutput: 'Table 24 created successfully',
	},
	{
		controller: 'tables',
		name: 'update_table',
		method: 'PUT',
		route: '/tables/:id',
		description: 'Updates a table by id.',
		inputSchema: {
			type: 'object',
			properties: {
				id: { type: 'number' },
				tableNumber: { type: 'number' },
				capacity: { type: 'number' },
			},
			required: ['id'],
			additionalProperties: false,
		},
		outputSchema: { type: 'string' },
		exampleInput: { id: 1, capacity: 6 },
		exampleOutput: 'Table 1 updated successfully',
	},
	{
		controller: 'tables',
		name: 'delete_table',
		method: 'DELETE',
		route: '/tables/:id',
		description: 'Deletes a table by id.',
		inputSchema: {
			type: 'object',
			properties: { id: { type: 'number' } },
			required: ['id'],
			additionalProperties: false,
		},
		outputSchema: { type: 'string' },
		exampleInput: { id: 1 },
		exampleOutput: 'Table 1 deleted successfully',
	},
	{
		controller: 'tables',
		name: 'clear_table',
		method: 'PATCH',
		route: '/tables/:id/clear',
		description: 'Clears a table and resets its occupancy.',
		inputSchema: {
			type: 'object',
			properties: { id: { type: 'number' } },
			required: ['id'],
			additionalProperties: false,
		},
		outputSchema: { type: 'string' },
		exampleInput: { id: 1 },
		exampleOutput: 'Table 1 cleared successfully',
	},
	{
		controller: 'tables',
		name: 'assign_table_to_server',
		method: 'POST',
		route: '/tables/assign',
		description: 'Assigns one or more tables to a server.',
		inputSchema: {
			type: 'object',
			properties: {
				serverId: { type: 'number' },
				assignedTables: { type: 'array', items: { type: 'number' } },
			},
			required: ['serverId', 'assignedTables'],
			additionalProperties: false,
		},
		outputSchema: { type: 'string' },
		exampleInput: { serverId: 7, assignedTables: [1, 2, 3] },
		exampleOutput: 'Tables 1, 2, 3 assigned to server 7 successfully',
	},
	{
		controller: 'tables',
		name: 'seat_guests',
		method: 'PATCH',
		route: '/tables/:id/seat',
		description: 'Seats guests at a table or converts a reservation into a seated table.',
		inputSchema: {
			type: 'object',
			properties: {
				tableNumber: { type: 'number' },
				guests: { type: 'number' },
				reservationId: { type: 'number' },
				SeatingType: { type: 'string' },
			},
			required: ['tableNumber', 'guests', 'SeatingType'],
			additionalProperties: false,
		},
		outputSchema: { type: 'string' },
		exampleInput: { tableNumber: 12, guests: 4, SeatingType: 'WALK_IN' },
		exampleOutput: 'Guests seated at table 12 successfully',
	},
	{
		controller: 'orders',
		name: 'get_order_meta',
		method: 'GET',
		route: '/orders/meta',
		description: 'Returns meta information used for order filters and dashboards.',
		inputSchema: {
			type: 'object',
			properties: {
				page: { type: 'number' },
				pageSize: { type: 'number' },
				status: { type: 'string' },
				tableNumber: { type: 'number' },
				serverId: { type: 'number' },
			},
			additionalProperties: false,
		},
		outputSchema: orderMetaSchema,
		exampleInput: { status: 'RECEIVED' },
		exampleOutput: {
			statuses: ['RECEIVED', 'PREPARING', 'SERVED'],
			allergies: ['GLUTEN', 'DAIRY'],
			maxGuests: 8,
			prices: { min: 0, max: 250 },
			dates: { min: '2026-01-01T00:00:00.000Z', max: '2026-01-31T23:59:59.000Z' },
			tableNumbers: [1, 2, 12],
			filtered: {
				maxGuests: 8,
				prices: { min: 0, max: 250 },
				dates: { min: '2026-01-01T00:00:00.000Z', max: '2026-01-31T23:59:59.000Z' },
				tableNumbers: [1, 2, 12],
			},
		},
	},
	{
		controller: 'orders',
		name: 'create_order',
		method: 'POST',
		route: '/orders',
		description: 'Creates a new order.',
		inputSchema: {
			type: 'object',
			properties: {
				tableNumber: { type: 'number' },
				guestsCount: { type: 'number' },
				serverId: { type: 'number' },
				items: { type: 'array', items: { type: 'object' } },
			},
			required: ['tableNumber', 'guestsCount', 'serverId'],
			additionalProperties: true,
		},
		outputSchema: noContentOutputSchema,
		exampleInput: { tableNumber: 12, guestsCount: 4, serverId: 5, items: [] },
		exampleOutput: null,
	},
	{
		controller: 'orders',
		name: 'update_order_items',
		method: 'PATCH',
		route: '/orders/:id/items',
		description: 'Replaces the food and drink items of an order.',
		inputSchema: {
			type: 'object',
			properties: {
				id: { type: 'number' },
				foodItems: { type: 'array', items: { type: 'number' } },
				drinkItems: { type: 'array', items: { type: 'number' } },
			},
			required: ['id'],
			additionalProperties: false,
		},
		outputSchema: noContentOutputSchema,
		exampleInput: { id: 101, foodItems: [1, 2], drinkItems: [3] },
		exampleOutput: null,
	},
	{
		controller: 'orders',
		name: 'update_order_properties',
		method: 'PATCH',
		route: '/orders/:id',
		description: 'Updates mutable order properties such as status, comments, discount, or tip.',
		inputSchema: {
			type: 'object',
			properties: {
				id: { type: 'number' },
				status: { type: 'string' },
				comments: { type: ['string', 'null'] },
				discount: { type: 'number' },
				tip: { type: 'number' },
			},
			required: ['id'],
			additionalProperties: true,
		},
		outputSchema: noContentOutputSchema,
		exampleInput: { id: 101, status: 'SERVED', tip: 12 },
		exampleOutput: null,
	},
	{
		controller: 'orders',
		name: 'print_order_items',
		method: 'POST',
		route: '/orders/:id/print',
		description: 'Prints a batch of order items for the order.',
		inputSchema: {
			type: 'object',
			properties: { ids: { type: 'array', items: { type: 'number' } } },
			required: ['ids'],
			additionalProperties: false,
		},
		outputSchema: noContentOutputSchema,
		exampleInput: { ids: [11, 12, 13] },
		exampleOutput: null,
	},
	{
		controller: 'orders',
		name: 'call_order_items',
		method: 'POST',
		route: '/orders/:id/call',
		description: 'Marks selected order items as called for service.',
		inputSchema: {
			type: 'object',
			properties: { orderItemsIds: { type: 'array', items: { type: 'number' } } },
			required: ['orderItemsIds'],
			additionalProperties: false,
		},
		outputSchema: noContentOutputSchema,
		exampleInput: { orderItemsIds: [11, 12] },
		exampleOutput: null,
	},
	{
		controller: 'orders',
		name: 'delete_order',
		method: 'DELETE',
		route: '/orders/:id',
		description: 'Deletes an order by id.',
		inputSchema: {
			type: 'object',
			properties: { id: { type: 'number' } },
			required: ['id'],
			additionalProperties: false,
		},
		outputSchema: noContentOutputSchema,
		exampleInput: { id: 101 },
		exampleOutput: null,
	},
	{
		controller: 'reservations',
		name: 'create_reservation',
		method: 'POST',
		route: '/reservations',
		description: 'Creates a reservation.',
		inputSchema: {
			type: 'object',
			properties: {
				guestsCount: { type: 'number' },
				time: { type: 'string' },
				name: { type: 'string' },
				phone: { type: 'string' },
				email: { type: ['string', 'null'] },
				status: { type: 'string' },
			},
			required: ['guestsCount', 'time', 'name', 'phone'],
			additionalProperties: true,
		},
		outputSchema: { type: ['object', 'null'] },
		exampleInput: { guestsCount: 2, time: '2026-01-02T18:00:00.000Z', name: 'Jane Doe', phone: '+10000000000' },
		exampleOutput: {
			id: 201,
			guestsCount: 2,
			time: '2026-01-02T18:00:00.000Z',
			name: 'Jane Doe',
			phone: '+10000000000',
			email: 'jane@example.com',
			status: 'PENDING',
			comments: null,
			createdAt: '2026-01-01T10:00:00.000Z',
			updatedAt: '2026-01-01T10:00:00.000Z',
			isActive: true,
		},
	},
	{
		controller: 'reservations',
		name: 'get_reservation_by_id',
		method: 'GET',
		route: '/reservations/:id',
		description: 'Gets a single reservation by id.',
		inputSchema: {
			type: 'object',
			properties: { id: { type: 'number' } },
			required: ['id'],
			additionalProperties: false,
		},
		outputSchema: { type: ['object', 'null'] },
		exampleInput: { id: 201 },
		exampleOutput: {
			id: 201,
			guestsCount: 2,
			time: '2026-01-02T18:00:00.000Z',
			name: 'Jane Doe',
			phone: '+10000000000',
			status: 'PENDING',
		},
	},
	{
		controller: 'reservations',
		name: 'update_reservation',
		method: 'PUT',
		route: '/reservations/:id',
		description: 'Updates reservation properties.',
		inputSchema: {
			type: 'object',
			properties: { id: { type: 'number' } },
			required: ['id'],
			additionalProperties: true,
		},
		outputSchema: reservationItemSchema,
		exampleInput: { id: 201, comments: 'Window seat please' },
		exampleOutput: { id: 201, comments: 'Window seat please', status: 'PENDING' },
	},
	{
		controller: 'reservations',
		name: 'update_reservation_status',
		method: 'PATCH',
		route: '/reservations/:id/status',
		description: 'Updates only the reservation status.',
		inputSchema: {
			type: 'object',
			properties: { id: { type: 'number' }, status: { type: 'string' } },
			required: ['id', 'status'],
			additionalProperties: false,
		},
		outputSchema: reservationItemSchema,
		exampleInput: { id: 201, status: 'CONFIRMED' },
		exampleOutput: { id: 201, status: 'CONFIRMED' },
	},
	{
		controller: 'reservations',
		name: 'update_reservation_time',
		method: 'PATCH',
		route: '/reservations/:id/time',
		description: 'Updates only the reservation time.',
		inputSchema: {
			type: 'object',
			properties: { id: { type: 'number' }, time: { type: 'string' } },
			required: ['id', 'time'],
			additionalProperties: false,
		},
		outputSchema: reservationItemSchema,
		exampleInput: { id: 201, time: '2026-01-02T19:00:00.000Z' },
		exampleOutput: { id: 201, time: '2026-01-02T19:00:00.000Z' },
	},
	{
		controller: 'reservations',
		name: 'update_reservation_tables',
		method: 'PATCH',
		route: '/reservations/:id/tables',
		description: 'Updates the tables attached to a reservation.',
		inputSchema: {
			type: 'object',
			properties: { id: { type: 'number' }, tables: { type: 'array', items: { type: 'number' } } },
			required: ['id', 'tables'],
			additionalProperties: false,
		},
		outputSchema: reservationItemSchema,
		exampleInput: { id: 201, tables: [1, 2] },
		exampleOutput: { id: 201, tables: [1, 2] },
	},
	{
		controller: 'reservations',
		name: 'update_reservation_guest_info',
		method: 'PATCH',
		route: '/reservations/:id/guest-info',
		description: 'Updates guest contact information for a reservation.',
		inputSchema: {
			type: 'object',
			properties: { id: { type: 'number' }, guestInfo: { type: 'object' } },
			required: ['id', 'guestInfo'],
			additionalProperties: false,
		},
		outputSchema: reservationItemSchema,
		exampleInput: { id: 201, guestInfo: { name: 'Jane Doe', phone: '+10000000000' } },
		exampleOutput: { id: 201, name: 'Jane Doe' },
	},
	{
		controller: 'reservations',
		name: 'update_reservation_comment',
		method: 'PATCH',
		route: '/reservations/:id/comment',
		description: 'Updates the reservation comment.',
		inputSchema: {
			type: 'object',
			properties: { id: { type: 'number' }, comments: { type: 'string' } },
			required: ['id', 'comments'],
			additionalProperties: false,
		},
		outputSchema: reservationItemSchema,
		exampleInput: { id: 201, comments: 'Birthday celebration' },
		exampleOutput: { id: 201, comments: 'Birthday celebration' },
	},
	{
		controller: 'reservations',
		name: 'update_reservation_allergies',
		method: 'PATCH',
		route: '/reservations/:id/allergies',
		description: 'Updates the reservation allergies list.',
		inputSchema: {
			type: 'object',
			properties: { id: { type: 'number' }, allergies: { type: 'array', items: { type: 'string' } } },
			required: ['id', 'allergies'],
			additionalProperties: false,
		},
		outputSchema: reservationItemSchema,
		exampleInput: { id: 201, allergies: ['GLUTEN'] },
		exampleOutput: { id: 201, allergies: ['GLUTEN'] },
	},
	{
		controller: 'reservations',
		name: 'delete_reservation',
		method: 'DELETE',
		route: '/reservations/:id',
		description: 'Deletes a reservation by id.',
		inputSchema: {
			type: 'object',
			properties: { id: { type: 'number' } },
			required: ['id'],
			additionalProperties: false,
		},
		outputSchema: messageOutputSchema,
		exampleInput: { id: 201 },
		exampleOutput: { message: 'Reservation deleted successfully' },
	},
	{
		controller: 'payments',
		name: 'list_payments',
		method: 'GET',
		route: '/payments',
		description: 'Lists payments with pagination and sort filters.',
		inputSchema: {
			type: 'object',
			properties: {
				page: { type: 'number' },
				pageSize: { type: 'number' },
				sortBy: { type: 'string' },
				sortOrder: { type: 'string' },
				orderId: { type: 'number' },
				status: { type: 'string' },
			},
			additionalProperties: false,
		},
		outputSchema: paymentListSchema,
		exampleInput: { page: 1, pageSize: 10, sortBy: 'id', sortOrder: 'asc' },
		exampleOutput: {
			payments: [
				{
					id: 1,
					amount: 86.4,
					tax: 0,
					tip: 0,
					serviceCharge: 0,
					paymentType: 'CASH',
					createdAt: '2026-01-01T10:00:00.000Z',
					completedAt: null,
					orderId: 101,
					status: 'PENDING',
				},
			],
			totalCount: 1,
			page: 1,
			pageSize: 10,
			totalPages: 1,
		},
	},
	{
		controller: 'payments',
		name: 'get_payment',
		method: 'GET',
		route: '/payments/:id',
		description: 'Gets a single payment by id.',
		inputSchema: {
			type: 'object',
			properties: { id: { type: 'number' } },
			required: ['id'],
			additionalProperties: false,
		},
		outputSchema: { type: ['object', 'null'] },
		exampleInput: { id: 1 },
		exampleOutput: { id: 1, amount: 86.4, paymentType: 'CASH', status: 'PENDING' },
	},
	{
		controller: 'payments',
		name: 'create_payment',
		method: 'POST',
		route: '/payments/order/:id',
		description: 'Creates a payment for an order using selected food and drink items.',
		inputSchema: {
			type: 'object',
			properties: {
				id: { type: 'number' },
				foodItems: { type: 'array', items: { type: 'number' } },
				drinkItems: { type: 'array', items: { type: 'number' } },
			},
			required: ['id', 'foodItems', 'drinkItems'],
			additionalProperties: false,
		},
		outputSchema: paymentItemSchema,
		exampleInput: { id: 101, foodItems: [1, 2], drinkItems: [3] },
		exampleOutput: { id: 1, amount: 86.4, paymentType: 'CASH', status: 'PENDING' },
	},
	{
		controller: 'payments',
		name: 'complete_payment',
		method: 'POST',
		route: '/payments/complete/:id',
		description: 'Marks a payment as completed.',
		inputSchema: {
			type: 'object',
			properties: { id: { type: 'number' } },
			required: ['id'],
			additionalProperties: false,
		},
		outputSchema: paymentItemSchema,
		exampleInput: { id: 1 },
		exampleOutput: { id: 1, amount: 86.4, paymentType: 'CASH', status: 'COMPLETED' },
	},
	{
		controller: 'payments',
		name: 'refund_payment',
		method: 'POST',
		route: '/payments/refund/:id',
		description: 'Refunds a payment for an administrative reason.',
		inputSchema: {
			type: 'object',
			properties: {
				id: { type: 'number' },
				reason: { type: 'string' },
			},
			required: ['id', 'reason'],
			additionalProperties: false,
		},
		outputSchema: paymentItemSchema,
		exampleInput: { id: 1, reason: 'Duplicate charge' },
		exampleOutput: { id: 1, amount: 86.4, paymentType: 'CASH', status: 'REFUNDED' },
	},
	{
		controller: 'payments',
		name: 'cancel_payment',
		method: 'POST',
		route: '/payments/cancel/:id',
		description: 'Cancels a payment that has not been completed.',
		inputSchema: {
			type: 'object',
			properties: { id: { type: 'number' } },
			required: ['id'],
			additionalProperties: false,
		},
		outputSchema: paymentItemSchema,
		exampleInput: { id: 1 },
		exampleOutput: { id: 1, amount: 86.4, paymentType: 'CASH', status: 'CANCELLED' },
	},
	{
		controller: 'food-items',
		name: 'create_food_item',
		method: 'POST',
		route: '/food-items',
		description: 'Creates a new food item.',
		inputSchema: {
			type: 'object',
			properties: {
				name: { type: 'string' },
				price: { type: 'number' },
				description: { type: 'string' },
				category: { type: 'string' },
			},
			required: ['name', 'price', 'description'],
			additionalProperties: true,
		},
		outputSchema: foodItemSchema,
		exampleInput: { name: 'Caesar Salad', price: 8.5, description: 'Fresh salad' },
		exampleOutput: {
			id: 301,
			name: 'Caesar Salad',
			price: 8.5,
			type: 'OTHER',
			category: 'OTHER',
			ingredients: ['lettuce', 'croutons', 'parmesan'],
			description: 'Fresh salad',
			isAvailable: true,
			preparationTime: 10,
			calories: 220,
			image: null,
			spicyLevel: 'NOT_SPICY',
			popularityScore: 0,
			isVegetarian: true,
			isVegan: false,
			isGlutenFree: false,
		},
	},
	{
		controller: 'food-items',
		name: 'get_food_item',
		method: 'GET',
		route: '/food-items/:id',
		description: 'Gets a single food item by id.',
		inputSchema: {
			type: 'object',
			properties: { id: { type: 'number' } },
			required: ['id'],
			additionalProperties: false,
		},
		outputSchema: { type: ['object', 'null'] },
		exampleInput: { id: 301 },
		exampleOutput: { id: 301, name: 'Caesar Salad', price: 8.5, description: 'Fresh salad' },
	},
	{
		controller: 'food-items',
		name: 'delete_food_item',
		method: 'DELETE',
		route: '/food-items/:id',
		description: 'Deletes a food item by id.',
		inputSchema: {
			type: 'object',
			properties: { id: { type: 'number' } },
			required: ['id'],
			additionalProperties: false,
		},
		outputSchema: noContentOutputSchema,
		exampleInput: { id: 301 },
		exampleOutput: null,
	},
	{
		controller: 'food-items',
		name: 'update_food_item',
		method: 'PATCH',
		route: '/food-items/:id',
		description: 'Updates a food item by id.',
		inputSchema: {
			type: 'object',
			properties: { id: { type: 'number' }, name: { type: 'string' }, price: { type: 'number' } },
			required: ['id'],
			additionalProperties: true,
		},
		outputSchema: foodItemSchema,
		exampleInput: { id: 301, price: 9 },
		exampleOutput: { id: 301, name: 'Caesar Salad', price: 9, description: 'Fresh salad' },
	},
	{
		controller: 'drink-items',
		name: 'create_drink_item',
		method: 'POST',
		route: '/drink-items',
		description: 'Creates a new drink item.',
		inputSchema: {
			type: 'object',
			properties: {
				name: { type: 'string' },
				price: { type: 'number' },
				volume: { type: 'number' },
				description: { type: 'string' },
			},
			required: ['name', 'price', 'volume', 'description'],
			additionalProperties: true,
		},
		outputSchema: drinkItemSchema,
		exampleInput: { name: 'Cola', price: 3, volume: 330, description: 'Soft drink' },
		exampleOutput: {
			id: 401,
			name: 'Cola',
			price: 3,
			category: 'OTHER',
			description: 'Soft drink',
			ingredients: ['water', 'sugar'],
			isAvailable: true,
			volume: 330,
			alcoholPercentage: null,
			image: null,
			isCarbonated: true,
			tempriture: 'ROOM',
			popularityScore: 0,
		},
	},
	{
		controller: 'drink-items',
		name: 'get_drink_item',
		method: 'GET',
		route: '/drink-items/:id',
		description: 'Gets a single drink item by id.',
		inputSchema: {
			type: 'object',
			properties: { id: { type: 'number' } },
			required: ['id'],
			additionalProperties: false,
		},
		outputSchema: { type: ['object', 'null'] },
		exampleInput: { id: 401 },
		exampleOutput: { id: 401, name: 'Cola', price: 3, description: 'Soft drink' },
	},
	{
		controller: 'drink-items',
		name: 'delete_drink_item',
		method: 'DELETE',
		route: '/drink-items/:id',
		description: 'Deletes a drink item by id.',
		inputSchema: {
			type: 'object',
			properties: { id: { type: 'number' } },
			required: ['id'],
			additionalProperties: false,
		},
		outputSchema: noContentOutputSchema,
		exampleInput: { id: 401 },
		exampleOutput: null,
	},
	{
		controller: 'drink-items',
		name: 'update_drink_item',
		method: 'PATCH',
		route: '/drink-items/:id',
		description: 'Updates a drink item by id.',
		inputSchema: {
			type: 'object',
			properties: { id: { type: 'number' }, name: { type: 'string' }, price: { type: 'number' } },
			required: ['id'],
			additionalProperties: true,
		},
		outputSchema: drinkItemSchema,
		exampleInput: { id: 401, price: 3.5 },
		exampleOutput: { id: 401, name: 'Cola', price: 3.5, description: 'Soft drink', volume: 330 },
	},
];

type CatalogDomain = {
	name: string;
	description: string;
	controllers: string[];
};

const catalogDomains: CatalogDomain[] = [
	{ name: 'api_catalog_auth', description: 'Returns only auth methods.', controllers: ['auth'] },
	{ name: 'api_catalog_users', description: 'Returns only user methods.', controllers: ['users'] },
	{ name: 'api_catalog_tables', description: 'Returns only table methods.', controllers: ['tables'] },
	{ name: 'api_catalog_orders', description: 'Returns only order methods.', controllers: ['orders'] },
	{
		name: 'api_catalog_reservations',
		description: 'Returns only reservation methods.',
		controllers: ['reservations'],
	},
	{ name: 'api_catalog_payments', description: 'Returns only payment methods.', controllers: ['payments'] },
	{
		name: 'api_catalog_menu',
		description: 'Returns only menu methods for food and drink items.',
		controllers: ['food-items', 'drink-items'],
	},
];

const catalogTool: Tool = {
	name: 'api_catalog',
	description: 'Returns the full catalog of methods with their accepted inputs and outputs.',
	inputSchema: emptyInputSchema,
};

const catalogTools: Tool[] = [
	catalogTool,
	...catalogDomains.map(({ name, description }) => ({
		name,
		description,
		inputSchema: emptyInputSchema,
	})),
];

function getCatalogByToolName(toolName: string): ToolMetadata[] {
	if (toolName === 'api_catalog') {
		return toolMetadata;
	}

	const domain = catalogDomains.find((entry) => entry.name === toolName);
	if (!domain) {
		return [];
	}

	return toolMetadata.filter((entry) => entry.controller && domain.controllers.includes(entry.controller));
}

const server = new Server(
	{
		name: 'servemate-mcp',
		version: '1.0.0',
	},
	{
		capabilities: {
			tools: {},
		},
	}
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: catalogTools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const catalog = getCatalogByToolName(request.params.name);
	if (catalog.length === 0) {
		return {
			isError: true,
			content: [
				{
					type: 'text' as const,
					text: `Unknown tool: ${request.params.name}`,
				},
			],
		};
	}

	return {
		content: [
			{
				type: 'text' as const,
				text: JSON.stringify(catalog, null, 2),
			},
		],
	};
});

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

void main().catch((error) => {
	console.error('Failed to start ServeMate MCP server:', error);
	process.exit(1);
});
