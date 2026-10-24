const LIB_ROOT = new URL('../../src/lib/', import.meta.url);

export const resolve = (specifier, context, next) => {
	if (specifier.startsWith('$lib/')) {
		return next(new URL(`${specifier.slice('$lib/'.length)}.ts`, LIB_ROOT).href, context);
	}

	return next(specifier, context);
};
