import { plaid } from '$lib/plaid';
import { json } from '@sveltejs/kit';

let ACCESS_TOKEN = ''; // Store in db after testing
export const POST = async (event) => {
	const body = await event.request.json();
	const tokenResponse = await plaid.itemPublicTokenExchange({
		public_token: body.public_token
	});
	ACCESS_TOKEN = tokenResponse.data.access_token;
	return json({ success: true });
};
