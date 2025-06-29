export const parseExpiresIn = (expiresIn: string | number, toMilliseconds = true): number => {
	if (typeof expiresIn === 'number') {
		return toMilliseconds ? expiresIn * 1000 : expiresIn;
	}

	const match = expiresIn.match(/(\d+)([smhd])/);

	if (!match) {
		const seconds = Number(expiresIn);
		return isNaN(seconds)
			? toMilliseconds
				? 900000
				: 900
			: toMilliseconds
				? seconds * 1000
				: seconds;
	}

	const value = parseInt(match[1], 10);
	const unit = match[2];

	let seconds = 0;
	switch (unit) {
		case 's':
			seconds = value;
			break;
		case 'm':
			seconds = value * 60;
			break;
		case 'h':
			seconds = value * 3600;
			break;
		case 'd':
			seconds = value * 86400;
			break;
		default:
			seconds = 900; // 15 минут по умолчанию
	}

	return toMilliseconds ? seconds : seconds;
};
