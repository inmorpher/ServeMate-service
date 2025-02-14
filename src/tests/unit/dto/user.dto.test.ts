import { UserRole } from '@prisma/client';
import {
	CreateUserSchema,
	IdParamSchema,
	UpdateUserSchema,
	UserLoginSchema,
	UserParamSchema,
	UserSchema,
	UserSortColumn,
} from '../../../dto/user.dto';

describe('User DTO Schemas', () => {
	describe('UserSchema', () => {
		it('should validate a correct user object', () => {
			const user = {
				id: 1,
				name: 'John Doe',
				email: 'john.doe@example.com',
				role: UserRole.USER,
				isActive: true,
				password: 'password123',
				createdAt: new Date(),
				updatedAt: new Date(),
				lastLogin: new Date(),
			};
			expect(() => UserSchema.parse(user)).not.toThrow();
		});

		it('should invalidate an incorrect user object', () => {
			const user = {
				id: 0,
				name: '',
				email: 'invalid-email',
				role: 'INVALID_ROLE',
				isActive: 'true',
				password: 'password123',
				createdAt: 'invalid-date',
				updatedAt: 'invalid-date',
				lastLogin: 'invalid-date',
			};
			expect(() => UserSchema.parse(user)).toThrow();
		});
	});

	describe('CreateUserSchema', () => {
		it('should validate a correct create user object', () => {
			const user = {
				name: 'John Doe',
				email: 'john.doe@example.com',
				role: UserRole.USER,
				password: 'password123',
			};
			expect(() => CreateUserSchema.parse(user)).not.toThrow();
		});

		it('should invalidate an incorrect create user object', () => {
			const user = {
				name: '',
				email: 'invalid-email',
				role: 'INVALID_ROLE',
				password: 'password123',
			};
			expect(() => CreateUserSchema.parse(user)).toThrow();
		});
	});

	describe('IdParamSchema', () => {
		it('should validate a correct ID parameter', () => {
			const idParam = { id: '123' };
			expect(() => IdParamSchema.parse(idParam)).not.toThrow();
		});

		it('should invalidate an incorrect ID parameter', () => {
			const idParam = { id: '' };
			expect(() => IdParamSchema.parse(idParam)).toThrow();
		});
	});

	describe('UserParamSchema', () => {
		it('should validate correct user query parameters', () => {
			const params = {
				id: '1',
				email: 'john.doe@example.com',
				name: 'John',
				page: '1',
				pageSize: '10',
				sortBy: UserSortColumn.NAME,
				sortOrder: 'asc',
				role: 'USER',
				isActive: 'true',
				createdAfter: '2021-01-01',
				createdBefore: '2021-12-31',
			};
			expect(() => UserParamSchema.parse(params)).not.toThrow();
		});

		it('should invalidate incorrect user query parameters', () => {
			const params = {
				id: 'invalid-id',
				email: 'invalid-email',
				name: 'Jo',
				page: 'invalid-page',
				pageSize: 'invalid-pageSize',
				sortBy: 'INVALID_SORT_COLUMN',
				sortOrder: 'invalid-sortOrder',
				role: 'INVALID_ROLE',
				isActive: 'invalid-isActive',
				createdAfter: 'invalid-date',
				createdBefore: 'invalid-date',
			};
			expect(() => UserParamSchema.parse(params)).toThrow();
		});
	});

	describe('UpdateUserSchema', () => {
		it('should validate a correct update user object', () => {
			const user = {
				name: 'John Doe',
				email: 'john.doe@example.com',
				role: UserRole.USER,
				isActive: true,
				lastLogin: new Date(),
			};
			expect(() => UpdateUserSchema.parse(user)).not.toThrow();
		});

		it('should invalidate an incorrect update user object', () => {
			const user = {
				name: '',
				email: 'invalid-email',
				role: 'INVALID_ROLE',
				isActive: 'true',
				lastLogin: 'invalid-date',
			};
			expect(() => UpdateUserSchema.parse(user)).toThrow();
		});
	});

	describe('UserLoginSchema', () => {
		it('should validate correct user login credentials', () => {
			const credentials = {
				email: 'john.doe@example.com',
				password: 'password123',
			};
			expect(() => UserLoginSchema.parse(credentials)).not.toThrow();
		});

		it('should invalidate incorrect user login credentials', () => {
			const credentials = {
				email: 'invalid-email',
				password: '',
			};
			expect(() => UserLoginSchema.parse(credentials)).toThrow();
		});
	});
});
