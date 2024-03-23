import { test } from 'vitest';
import { ollama } from './ollama';

test('ollama', { timeout: 100000 }, async () => {
	const response = await ollama({ model: 'mixtral', prompt: 'test' });
	console.log(response.message.content);
});
