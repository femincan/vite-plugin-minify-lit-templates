import type { Plugin } from 'vite';

function minifyLitTemplates(): Plugin {
	return {
		name: 'minify-lit-templates',
		enforce: 'pre',
	};
}

export default minifyLitTemplates;
