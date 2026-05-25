jest.mock('inversify', () => ({
	inject: () => () => undefined,
	injectable: () => (target: unknown) => target,
}));

export { };
