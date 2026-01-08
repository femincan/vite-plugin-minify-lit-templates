import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import MagicString from 'magic-string';
import {
	type MinifyCSSOptions,
	type MinifyHTMLOptions,
	minifyCSS,
	minifyHTML,
} from 'minify-html-css';
import { createFilter, type Plugin } from 'vite';
import { mergeOptions } from './utils/lib';

// @ts-expect-error Docs recommend doing in this way because of cjs and esm interop
const traverse = _traverse.default as typeof _traverse;

export type PluginOptions = {
	include: string | string[];
	exclude: string | string[];
	options: {
		html: MinifyHTMLOptions;
		css: MinifyCSSOptions;
	};
};

const defaultOptions: Partial<PluginOptions> = {
	include: '**/*.{js,ts,mjs,mts,jsx,tsx}',
};

export default function minifyLitTemplates(
	options?: Partial<PluginOptions>,
): Plugin {
	const mergedOptions = mergeOptions(defaultOptions, options || {});
	const filter = createFilter(mergedOptions.include, mergedOptions.exclude);

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
					if (p.node.tag.type !== 'Identifier') return;

					const templateLiteral = p.node.quasi;
					if (templateLiteral.start == null || templateLiteral.end == null)
						return;

					const quasis = templateLiteral.quasis.map((q) => q.value.raw);
					const expressions = [];

					for (const e of templateLiteral.expressions) {
						if (e.start == null || e.end == null) return;

						expressions.push(code.slice(e.start, e.end));
					}

					const expressionPlaceholderMap = new Map();

					for (let i = 0; i < quasis.length - 1; i++) {
						const placeholder = `__LIT_EXPRESSION_${i}__`;
						expressionPlaceholderMap.set(placeholder, expressions[i]);

						quasis[i] += placeholder;
					}

					const joinedQuasis = quasis.join('');

					const tagName = p.node.tag.name;
					let minifyResult = null;

					if (tagName === 'html') {
						minifyResult = minifyHTML(joinedQuasis);

						// FIXME: Return null on error for now
						if (minifyResult.errors?.length) return;
					}

					if (tagName === 'css') {
						minifyResult = minifyCSS(joinedQuasis);

						// FIXME: Return null on warnings for now
						if (minifyResult.warnings?.length) return;
					}

					if (minifyResult === null) return;

					for (const placeholder of expressionPlaceholderMap.keys()) {
						minifyResult.code = minifyResult.code
							.split(placeholder)
							.join(`\${${expressionPlaceholderMap.get(placeholder)}}`);
					}

					ms.overwrite(
						templateLiteral.start,
						templateLiteral.end,
						`\`${minifyResult.code}\``,
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
