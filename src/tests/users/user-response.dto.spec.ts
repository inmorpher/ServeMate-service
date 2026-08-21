import { UserResponseSchema } from '../../users/dto';

describe('UserResponseSchema', () => {
  it('does not expose the password field', () => {
    const result = UserResponseSchema.parse({
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      role: 'ADMIN',
      password: 'should-not-be-returned',
    });

    expect(result).not.toHaveProperty('password');
  });
});
