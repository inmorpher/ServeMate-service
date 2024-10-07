import bcrypt from 'bcrypt';
import { hashPassword } from './password';

jest.mock('bcrypt', () => ({
	hash: jest.fn(),
}));

describe('hashPassword', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});
	it('should hash a simple password correctly', async () => {
		const password = 'password123';
		const hashedPassword = 'hashedPassword123';

		(bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

		const result = await hashPassword(password);

		expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
		expect(result).toBe(hashedPassword);
	});

	it('should hash a complex password with special characters', async () => {
		const password = 'P@ssw0rd!$%^&*()';
		const hashedPassword = 'complexHashedPassword123!@#';

		(bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

		const result = await hashPassword(password);

		expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
		expect(result).toBe(hashedPassword);
	});

	it('should return a different hash for the same password when called multiple times', async () => {
		const password = 'testPassword123';

		(bcrypt.hash as jest.Mock)
			.mockResolvedValueOnce('firstHash')
			.mockResolvedValueOnce('secondHash');

		const firstHash = await hashPassword(password);
		const secondHash = await hashPassword(password);

		expect(firstHash).not.toBe(secondHash);
		expect(bcrypt.hash).toHaveBeenCalledTimes(2);
		expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
	});
});
