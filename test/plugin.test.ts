import { describe, expect, test } from 'bun:test';
import minifyLitTemplates from '../src/index';

describe('minifyLitTemplates plugin', () => {
	test('should have the correct name', () => {
		const plugin = minifyLitTemplates();
		expect(plugin.name).toBe('minify-lit-templates');
	});
});
