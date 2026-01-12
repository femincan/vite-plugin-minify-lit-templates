import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import type { Expression } from '@babel/types';
import MagicString from 'magic-string';
import {
	type MinifyCSSOptions,
	type MinifyHTMLOptions,
	minifyCSS,
	minifyHTML,
} from 'minify-html-css';
import { createFilter, type Plugin } from 'vite';
import { mergeOptions } from './utils';

// @ts-expect-error Typescript definitions are missing
const traverse = _traverse.default as typeof _traverse;

export type Options = Partial<{
	include: string | string[];
	exclude: string | string[];
	minifierOptions: {
		html: MinifyHTMLOptions;
		css: MinifyCSSOptions;
	};
}>;

type ResolvedOptions = {
	include: string | string[];
	exclude?: string | string[];
	minifierOptions: {
		html: MinifyHTMLOptions;
		css: MinifyCSSOptions;
	};
};

type TemplateKind = 'html' | 'css';

const defaultOptions: ResolvedOptions = {
	include: '**/*.{js,ts,mjs,mts,jsx,tsx}',
	minifierOptions: {
		html: {},
		css: {},
	},
};

function resolveOptions(options?: Options): ResolvedOptions {
	return mergeOptions(defaultOptions, options ?? {});
}

const templateKindMap: Record<string, TemplateKind> = {
	html: 'html',
	css: 'css',
	unsafeHTML: 'html',
	unsafeCSS: 'css',
};

function getTemplateKind(tag: Expression): TemplateKind | null {
	if (tag.type === 'Identifier') {
		return templateKindMap[tag.name] ?? null;
	}

	// Handle cases like `lit.html` or `lit.css`
	if (
		tag.type === 'MemberExpression' &&
		tag.object.type === 'Identifier' &&
		tag.object.name === 'lit' &&
		tag.property.type === 'Identifier'
	) {
		return templateKindMap[tag.property.name] ?? null;
	}

	return null;
}

function createPlaceholder(index: number): string {
	return `__LIT_EXPRESSION_${index}__`;
}

function createExpression(expression: unknown) {
	// biome-ignore lint/style/useTemplate: Explicitly creating a template expression
	return '${' + expression + '}';
}

function createTemplateLiteral(content: string): string {
	// biome-ignore lint/style/useTemplate: Explicitly creating a template literal
	return '`' + content + '`';
}

function buildTemplateWithPlaceholders(quasisRaw: string[]): string {
	let template = '';
	for (let i = 0; i < quasisRaw.length - 1; i++) {
		template += quasisRaw[i] + createPlaceholder(i);
	}
	template += quasisRaw[quasisRaw.length - 1];
	return template;
}

function restoreExpressions(
	minifiedCode: string,
	expressions: string[],
): string {
	let result = minifiedCode;
	for (let i = 0; i < expressions.length; i++) {
		result = result.replace(
			createPlaceholder(i),
			createExpression(expressions[i]),
		);
	}
	return result;
}

function minifyTemplate(
	kind: TemplateKind,
	templateContent: string,
	options: ResolvedOptions['minifierOptions'],
): string | null {
	if (kind === 'html') {
		const result = minifyHTML(templateContent, options.html);
		if (result.errors?.length) return null;
		return result.code;
	}

	if (kind === 'css') {
		const result = minifyCSS(templateContent, options.css);
		if (result.warnings?.length) return null;
		return result.code;
	}

	return null;
}

export default function minifyLitTemplates(options?: Partial<Options>): Plugin {
	const resolvedOptions = resolveOptions(options);
	const filter = createFilter(resolvedOptions.include, resolvedOptions.exclude);

	return {
		name: 'minify-lit-templates',
		enforce: 'pre',

		transform(code, id) {
			if (!filter(id)) return;

			let ast: ReturnType<typeof parse> | null = null;
			try {
				ast = parse(code, {
					sourceType: 'module',
					plugins: ['typescript', 'jsx', 'decorators'],
				});
			} catch (e) {
				console.error(e);
				return null;
			}

			const ms = new MagicString(code);
			let minified = false;

			traverse(ast, {
				TaggedTemplateExpression(p) {
					const kind = getTemplateKind(p.node.tag);
					if (kind === null) return;

					const templateLiteral = p.node.quasi;
					if (templateLiteral.start == null || templateLiteral.end == null)
						return;

					const quasisRaw = templateLiteral.quasis.map((q) => q.value.raw);
					const expressions: string[] = [];

					for (const e of templateLiteral.expressions) {
						if (e.start == null || e.end == null) return;

						expressions.push(code.slice(e.start, e.end));
					}

					const templateWithPlaceholders =
						buildTemplateWithPlaceholders(quasisRaw);

					const minifiedCode = minifyTemplate(
						kind,
						templateWithPlaceholders,
						resolvedOptions.minifierOptions,
					);
					if (minifiedCode === null) return;

					const restoredCode = restoreExpressions(minifiedCode, expressions);

					ms.overwrite(
						templateLiteral.start,
						templateLiteral.end,
						createTemplateLiteral(restoredCode),
					);
					minified = true;
				},
			});

			if (!minified) return null;

			return {
				code: ms.toString(),
				map: ms.generateMap({ hires: true }),
			};
		},
	};
}
