export const isNullish = <T>(value: T | null | undefined): value is null | undefined =>
	value === null || value === undefined; // eslint-disable-line no-restricted-syntax

export const nonNullish = <T>(value: T | null | undefined): value is NonNullable<T> =>
	!isNullish(value);
