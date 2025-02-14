import { baseItemSchema } from '../../../dto/items.dto';

describe('baseItemSchema', () => {
	it('should validate a correct item object', () => {
		const validItem = {
			id: 1,
			name: 'Test Item',
			price: 10.99,
			description: 'This is a test item description',
			popularityScore: 4.5,
			image: 'test.jpg',
		};

		const result = baseItemSchema.parse(validItem);
		expect(result).toEqual({
			...validItem,
			ingredients: [],
			isAvailable: true,
			image: 'test.jpg',
		});
	});

	describe('id field', () => {
		it('should coerce string numbers to integers', () => {
			const result = baseItemSchema.parse({
				id: '123',
				name: 'Test',
				price: 10,
				description: 'Test description',
				popularityScore: 0,
			});
			expect(result.id).toBe(123);
		});

		it('should reject negative ids', () => {
			expect(() =>
				baseItemSchema.parse({
					id: -1,
					name: 'Test',
					price: 10,
					description: 'Test description',
					popularityScore: 0,
				})
			).toThrow();
		});
	});

	describe('name field', () => {
		it('should reject names shorter than 3 characters', () => {
			expect(() =>
				baseItemSchema.parse({
					id: 1,
					name: 'ab',
					price: 10,
					description: 'Test description',
					popularityScore: 0,
				})
			).toThrow();
		});
	});

	describe('price field', () => {
		it('should reject negative prices', () => {
			expect(() =>
				baseItemSchema.parse({
					id: 1,
					name: 'Test',
					price: -10,
					description: 'Test description',
					popularityScore: 0,
				})
			).toThrow();
		});
	});

	describe('description field', () => {
		it('should reject descriptions shorter than 3 characters', () => {
			expect(() =>
				baseItemSchema.parse({
					id: 1,
					name: 'Test',
					price: 3,
					description: 'Sh',
					popularityScore: 0,
				})
			).toThrow();
		});
	});

	describe('default values', () => {
		it('should set default values for optional fields', () => {
			const result = baseItemSchema.parse({
				id: '1',
				name: 'Test',
				price: 10,
				description: 'Test description',
				popularityScore: 0,
				Image: null,
			});

			expect(result.ingredients).toEqual([]);
			expect(result.isAvailable).toBe(true);
		});
	});

	describe('ingredients field', () => {
		it('should accept an array of strings', () => {
			const result = baseItemSchema.parse({
				id: 1,
				name: 'Test',
				price: 10,
				description: 'Test description',
				popularityScore: 0,
				ingredients: ['ingredient1', 'ingredient2'],
			});

			expect(result.ingredients).toEqual(['ingredient1', 'ingredient2']);
		});
	});

	describe('image field', () => {
		it('should accept null values', () => {
			const result = baseItemSchema.parse({
				id: 1,
				name: 'Test',
				price: 10,
				description: 'Test description',
				popularityScore: 0,
				image: null,
			});

			expect(result.image).toBeNull();
		});
	});
});
