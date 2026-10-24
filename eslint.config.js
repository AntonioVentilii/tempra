import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node, __APP_VERSION__: 'readonly' }
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},
	{
		rules: {
			// Links are plain hrefs: the site is static, served from the domain root.
			'svelte/no-navigation-without-resolve': 'off',
			'no-restricted-syntax': [
				'error',
				{
					selector:
						"BinaryExpression[operator=/^[!=]==?$/]:matches([left.type='Identifier'][left.name='undefined'], [left.type='Literal'][left.raw='null'], [right.type='Identifier'][right.name='undefined'], [right.type='Literal'][right.raw='null'])",
					message: 'Use isNullish() / nonNullish() from $lib/utils/nullish.utils.'
				}
			]
		}
	},
	{
		ignores: [
			'build/',
			'.svelte-kit/',
			'dist/',
			'node_modules/',
			'.claude/worktrees/',
			'android/',
			'ios/',
			'playwright-report/',
			'test-results/'
		]
	}
);
