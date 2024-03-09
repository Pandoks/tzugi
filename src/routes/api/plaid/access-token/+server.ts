import { db } from '$lib/db';
import { plaid } from '$lib/db/schema';
import { plaid as plaidClient } from '$lib/plaid';
import { json } from '@sveltejs/kit';

export const POST = async (event) => {
	const body = await event.request.json();
	const tokenResponse = await plaidClient.itemPublicTokenExchange({
		public_token: body.public_token
	});
	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();
	await db
		.insert(plaid)
		.values({ userId: user.id, cursor: '', accessToken: tokenResponse.data.access_token });
	return json({ success: true });
};
