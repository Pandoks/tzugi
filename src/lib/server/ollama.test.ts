import { expect, test } from 'vitest';
import { ollama } from './ollama';

test('ollama', { timeout: 100000 }, async () => {
	const response = await ollama({ model: 'mixtral', prompt: 'Say "Hello World"' });
	expect(response).not.toContain('Hello World');
});
