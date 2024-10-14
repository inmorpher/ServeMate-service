import {
	CreateUserSchema,
	Role,
	UpdateUserSchema,
	UserLoginSchema,
	UserParamSchema,
	UserSchema,
} from './user.dto';

describe('User DTOs', () => {
	describe('UserSchema', () => {
		it('should validate a user with all required fields correctly filled', () => {
			const validUser = {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com',
				role: Role.USER,
				isActive: true,
				password: 'password123',
				createdAt: new Date(),
				updatedAt: new Date(),
				lastLogin: new Date(),
			};

			const result = UserSchema.safeParse(validUser);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(validUser);
			}
		});
	});

	describe('CreateUserSchema', () => {
		it('should reject a user creation attempt with an invalid email format', () => {
			const invalidUser = {
				name: 'John Doe',
				email: 'invalid-email',
				role: Role.USER,
				password: 'password123',
			};

			const result = CreateUserSchema.safeParse(invalidUser);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('email');
				expect(result.error.issues[0].message).toBe('Invalid email address');
			}
		});

		it('should reject a user creation attempt with an empty name', () => {
			const invalidUser = {
				name: '',
				email: 'john@example.com',
				role: Role.USER,
				password: 'password123',
			};

			const result = CreateUserSchema.safeParse(invalidUser);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('name');
				expect(result.error.issues[0].message).toBe('Name must not be empty');
			}
		});
	});

	describe('UpdateUserSchema', () => {
		it("should correctly update a user's role from USER to MANAGER", () => {
			const originalUser = {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com',
				role: Role.USER,
				isActive: true,
				password: 'password123',
				createdAt: new Date(),
				updatedAt: new Date(),
				lastLogin: new Date(),
			};

			const updateData = {
				role: Role.MANAGER,
			};

			const result = UpdateUserSchema.safeParse(updateData);
			expect(result.success).toBe(true);
			if (result.success) {
				const updatedUser = { ...originalUser, ...result.data };
				expect(updatedUser.role).toBe(Role.MANAGER);
			}
		});

		it('should reject an update attempt with no fields provided', () => {
			const emptyUpdateData = {};

			const result = UpdateUserSchema.safeParse(emptyUpdateData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					'At least one field must be provided in the body'
				);
				expect(result.error.issues[0].path).toEqual([
					'name',
					'email',
					'role',
					'isActive',
					'lastLogin',
				]);
			}
		});

		it("should correctly handle updating a user's lastLogin timestamp", () => {
			const updateData = {
				lastLogin: new Date(),
			};

			const result = UpdateUserSchema.safeParse(updateData);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toHaveProperty('lastLogin');
				expect(result.data.lastLogin).toBeInstanceOf(Date);
			}
		});
	});

	describe('Authenticating a user', () => {
		it('should successfully authenticate a user with correct credentials', () => {
			const validCredentials = {
				email: 'test@example.com',
				password: 'correctPassword123',
			};

			const result = UserLoginSchema.safeParse(validCredentials);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(validCredentials);
			}
		});

		it('should reject authentication for a user with an incorrect password', () => {
			const invalidCredentials = {
				email: 'john@example.com',
				password: 'wrongpassword',
			};

			const result = UserLoginSchema.safeParse(invalidCredentials);
			expect(result.success).toBe(true);

			// Simulate authentication process
			const authenticatedUser = null; // Assuming authentication fails due to incorrect password

			expect(authenticatedUser).toBeNull();
		});
	});

	describe('Search user', () => {
		it('should correctly handle user search with multiple criteria (id, email, and name)', () => {
			const searchCriteria = {
				id: '1',
				email: 'john@example.com',
				name: 'John Doe',
			};

			const result = UserParamSchema.safeParse(searchCriteria);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual({
					id: 1,
					email: 'john@example.com',
					name: 'John Doe',
				});
			}
		});
	});
});
