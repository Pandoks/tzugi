import ollamaClient, { type ChatResponse } from 'ollama';

export const ollama = async ({
	model,
	prompt
}: {
	model: string;
	prompt: string;
}): Promise<ChatResponse> => {
	const response = ollamaClient.chat({
		model: model,
		messages: [{ role: 'user', content: prompt }]
	});

	return response;
};
