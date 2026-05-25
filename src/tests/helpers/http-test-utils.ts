import { NextFunction, Request, Response } from 'express';

export type MockResponse = Response & {
	status: jest.Mock;
	type: jest.Mock;
	json: jest.Mock;
	send: jest.Mock;
	sendStatus: jest.Mock;
	cookie: jest.Mock;
	clearCookie: jest.Mock;
	statusCode: number;
};

export function createMockResponse(): MockResponse {
	const res = {
		statusCode: 200,
	} as MockResponse;

	res.status = jest.fn((code: number) => {
		res.statusCode = code;
		return res;
	});
	res.type = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	res.send = jest.fn().mockReturnValue(res);
	res.sendStatus = jest.fn((code: number) => {
		res.statusCode = code;
		return res;
	});
	res.cookie = jest.fn().mockReturnValue(res);
	res.clearCookie = jest.fn().mockReturnValue(res);

	return res;
}

export function createMockNext(): NextFunction {
	return jest.fn();
}

export function createMockRequest(overrides: Partial<Request> = {}): Request {
	return {
		body: {},
		query: {},
		params: {},
		headers: {},
		cookies: {},
		...overrides,
	} as Request;
}