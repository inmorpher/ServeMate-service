import { hash } from 'bcrypt';
import { hashPassword } from '../../utils/password';

jest.mock('bcrypt', () => ({
	hash: jest.fn().mockResolvedValue('hashed-password'),
}));

const hashMock = hash as jest.MockedFunction<typeof hash>;

describe('hashPassword', () => {
	it('hashes a password with the default salt rounds', async () => {
		await expect(hashPassword('secret')).resolves.toBe('hashed-password');
		expect(hashMock).toHaveBeenCalledWith('secret', 10);
	});
});