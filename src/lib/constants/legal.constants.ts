// Who runs Tempra and how to reach them: the only two values /privacy and /terms
// need from outside the catalogs. While either is unset both pages say they are a
// draft and show the placeholder. Fill both before a store submission (HANDOVER.md).
export const LEGAL_OWNER: string | undefined = undefined;
export const LEGAL_EMAIL: string | undefined = undefined;

export const TERMS_SECTIONS = [
	'service',
	'use',
	'content',
	'report',
	'health',
	'availability',
	'liability',
	'code',
	'law'
] as const;
