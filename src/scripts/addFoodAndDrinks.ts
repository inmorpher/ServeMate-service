import { FoodCategory, FoodType, Prisma, PrismaClient } from '@prisma/client';
import { DrinkCategory } from '@servemate/dto';

const prisma = new PrismaClient();

async function seedMenuItems() {
	try {
		// Seed food items
		const foodItems: Prisma.FoodItemCreateInput[] = [
			{
				name: 'Caesar Salad',
				description: 'Classic Caesar salad with croutons and parmesan cheese',
				price: 9.99,
				category: FoodCategory.SALAD,
				type: FoodType.APPETIZER,
				isAvailable: true,
				ingredients: ['Croutons', 'Parmesan cheese', 'Tomatoes', 'Onions'],
				allergies: ['GLUTEN', 'DAIRY'],
				isVegetarian: true,
				isVegan: false,
				spicyLevel: 'NOT_SPICY',
				preparationTime: 15,
				calories: 300,
			},
			{
				name: 'Grilled Salmon',
				description: 'Fresh salmon fillet grilled to perfection',
				price: 18.99,
				category: FoodCategory.FISH,
				type: FoodType.MAIN_COURSE,
				ingredients: ['Salmon fillet', 'Garlic', 'Olive oil', 'Onions'],
				allergies: ['GLUTEN', 'FISH'],
				isVegetarian: false,
				isVegan: false,
				spicyLevel: 'NOT_SPICY',
				preparationTime: 30,
				calories: 400,
			},
			{
				name: 'Chocolate Mousse',
				description: 'Rich and creamy chocolate mousse',
				price: 6.99,
				category: FoodCategory.OTHER,
				type: FoodType.DESSERT,
				isAvailable: true,

				ingredients: ['Chocolate', 'Milk'],
				allergies: ['GLUTEN', 'DAIRY'],
				isVegetarian: true,
				isVegan: false,
				spicyLevel: 'NOT_SPICY',
				preparationTime: 10,
				calories: 200,
			},
			{
				name: 'Margherita Pizza',
				description: 'Classic Italian pizza with tomato sauce, mozzarella, and basil',
				price: 14.99,
				category: FoodCategory.OTHER,
				type: FoodType.MAIN_COURSE,
				isAvailable: true,

				ingredients: ['Tomato sauce', 'Mozzarella cheese', 'Basil'],
				allergies: ['GLUTEN', 'DAIRY'],
				isVegetarian: true,
				isVegan: false,
				spicyLevel: 'NOT_SPICY',
				preparationTime: 20,
				calories: 800,
			},
			{
				name: 'Beef Burger',
				description: 'Juicy beef patty with lettuce, tomato, and cheese in a brioche bun',
				price: 12.99,
				category: FoodCategory.OTHER,
				type: FoodType.MAIN_COURSE,
				isAvailable: true,

				ingredients: ['Beef patty', 'Lettuce', 'Tomato', 'Cheese', 'Brioche bun'],
				allergies: ['GLUTEN', 'DAIRY'],
				isVegetarian: false,
				isVegan: false,
				spicyLevel: 'MILD',
				preparationTime: 25,
				calories: 650,
			},
			{
				name: 'Vegetable Stir Fry',
				description: 'Mixed vegetables stir-fried in a savory sauce',
				price: 11.99,
				category: FoodCategory.VEGGIES,
				type: FoodType.MAIN_COURSE,
				isAvailable: true,

				ingredients: ['Mixed vegetables', 'Soy sauce', 'Garlic', 'Ginger'],
				allergies: ['SOY'],
				isVegetarian: true,
				isVegan: true,
				spicyLevel: 'MEDIUM',
				preparationTime: 20,
				calories: 300,
			},
			{
				name: 'Chicken Wings',
				description: 'Crispy chicken wings with your choice of sauce',
				price: 10.99,
				category: FoodCategory.MEAT,
				type: FoodType.APPETIZER,
				isAvailable: true,

				ingredients: ['Chicken wings', 'Flour', 'Spices'],
				allergies: ['GLUTEN'],
				isVegetarian: false,
				isVegan: false,
				spicyLevel: 'HOT',
				preparationTime: 30,
				calories: 500,
			},
			{
				name: 'Greek Salad',
				description: 'Fresh salad with feta cheese, olives, and Mediterranean dressing',
				price: 8.99,
				category: FoodCategory.SALAD,
				type: FoodType.APPETIZER,
				isAvailable: true,

				ingredients: ['Lettuce', 'Feta cheese', 'Olives', 'Cucumber', 'Tomatoes'],
				allergies: ['DAIRY'],
				isVegetarian: true,
				isVegan: false,
				spicyLevel: 'NOT_SPICY',
				preparationTime: 15,
				calories: 250,
			},
			{
				name: 'Spaghetti Carbonara',
				description: 'Classic Italian pasta with eggs, cheese, and pancetta',
				price: 13.99,
				category: FoodCategory.OTHER,
				type: FoodType.MAIN_COURSE,
				isAvailable: true,

				ingredients: ['Spaghetti', 'Eggs', 'Parmesan cheese', 'Pancetta'],
				allergies: ['GLUTEN', 'DAIRY', 'EGG'],
				isVegetarian: false,
				isVegan: false,
				spicyLevel: 'NOT_SPICY',
				preparationTime: 25,
				calories: 700,
			},
			{
				name: 'Fruit Tart',
				description: 'Buttery pastry filled with custard and topped with fresh fruits',
				price: 7.99,
				category: FoodCategory.OTHER,
				type: FoodType.DESSERT,
				isAvailable: true,

				ingredients: ['Pastry', 'Custard', 'Assorted fruits'],
				allergies: ['GLUTEN', 'DAIRY', 'EGG'],
				isVegetarian: true,
				isVegan: false,
				spicyLevel: 'NOT_SPICY',
				preparationTime: 15,
				calories: 350,
			},
			{
				name: 'Mushroom Risotto',
				description: 'Creamy Italian rice dish with assorted mushrooms',
				price: 15.99,
				category: FoodCategory.OTHER,
				type: FoodType.MAIN_COURSE,
				isAvailable: true,

				ingredients: ['Arborio rice', 'Mushrooms', 'Parmesan cheese', 'White wine'],
				allergies: ['DAIRY'],
				isVegetarian: true,
				isVegan: false,
				spicyLevel: 'NOT_SPICY',
				preparationTime: 35,
				calories: 450,
			},
			{
				name: 'Beef Tacos',
				description: 'Three soft tacos with seasoned ground beef, lettuce, and cheese',
				price: 11.99,
				category: FoodCategory.OTHER,
				type: FoodType.MAIN_COURSE,
				isAvailable: true,

				ingredients: ['Tortillas', 'Ground beef', 'Lettuce', 'Cheese', 'Tomatoes'],
				allergies: ['GLUTEN', 'DAIRY'],
				isVegetarian: false,
				isVegan: false,
				spicyLevel: 'MEDIUM',
				preparationTime: 20,
				calories: 550,
			},
			{
				name: 'Caprese Salad',
				description: 'Fresh mozzarella, tomatoes, and basil drizzled with balsamic glaze',
				price: 9.99,
				category: FoodCategory.SALAD,
				type: FoodType.APPETIZER,
				isAvailable: true,

				ingredients: ['Mozzarella', 'Tomatoes', 'Basil', 'Balsamic glaze'],
				allergies: ['DAIRY'],
				isVegetarian: true,
				isVegan: false,
				spicyLevel: 'NOT_SPICY',
				preparationTime: 10,
				calories: 300,
			},
		];

		for (const item of foodItems) {
			await prisma.foodItem.create({ data: item });
		}

		console.log('Food items seeded successfully');

		// Seed drink items
		const drinkItems: Prisma.DrinkItemCreateInput[] = [
			{
				name: 'House Red Wine',
				description: 'Our signature red wine blend',
				price: 7.99,
				category: DrinkCategory.WINE,
				isAvailable: true,

				volume: 12,
			},
			{
				name: 'Craft IPA',
				description: "Local brewery's India Pale Ale",
				price: 5.99,
				category: DrinkCategory.BEER,
				isAvailable: true,

				volume: 16,
			},
			{
				name: 'Espresso',
				description: 'Single shot of espresso',
				price: 2.99,
				category: DrinkCategory.COFFEE,
				isAvailable: true,

				volume: 1,
			},
		];

		for (const item of drinkItems) {
			await prisma.drinkItem.create({ data: item });
		}

		console.log('Drink items seeded successfully');

		// ... rest of the h (error) {
	} catch (error) {
		console.error('Error seeding menu items:', error);
	} finally {
		await prisma.$disconnect();
	}
}

seedMenuItems();
