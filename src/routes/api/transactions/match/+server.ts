import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async (event) => {
	const body = await event.request.json();
	return;
};
