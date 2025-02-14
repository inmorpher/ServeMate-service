module.exports = {
	testTimeout: 30000,
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/src/tests'], // изменено для чтения тестов из папки test, включая вложенные папки
	transform: {
		'^.+\\.tsx?$': [
			'ts-jest',
			{
				tsconfig: 'tsconfig.json',
			},
		],
	},
	testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	coverageDirectory: 'coverage',
	collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
	coveragePathIgnorePatterns: ['/node_modules/', '/src/app.ts', '/src/scripts/'],
};
