import { parseExpiresIn } from '../../utils/expireEncoder';

describe('parseExpiresIn', () => {
	it('converts numeric values to milliseconds by default', () => {
		expect(parseExpiresIn(15)).toBe(15000);
	});

	it('returns the raw number when milliseconds are disabled', () => {
		expect(parseExpiresIn(15, false)).toBe(15);
	});

	it('parses second, minute, hour, and day suffixes', () => {
		expect(parseExpiresIn('30s')).toBe(30000);
		expect(parseExpiresIn('2m')).toBe(120000);
		expect(parseExpiresIn('3h')).toBe(10800000);
		expect(parseExpiresIn('1d')).toBe(86400000);
	});

	it('falls back to the default TTL for invalid values', () => {
		expect(parseExpiresIn('not-a-duration')).toBe(900000);
		expect(parseExpiresIn('not-a-duration', false)).toBe(900);
	});

	it('falls back to numeric strings when no unit is present', () => {
		expect(parseExpiresIn('45')).toBe(45000);
		expect(parseExpiresIn('45', false)).toBe(45);
	});
});