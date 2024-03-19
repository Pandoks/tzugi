import { db } from '$lib/db';
import { plaid } from '$lib/db/schema';
import { plaid as plaidClient } from '$lib/plaid';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async (event) => {
	const { public_token, metadata } = await event.request.json();
	const tokenResponse = await plaidClient.itemPublicTokenExchange({
		public_token: public_token
	});

	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();

	await db
		.insert(plaid)
		.values({
			userId: user.id,
			cursor: '',
			accessToken: tokenResponse.data.access_token,
			institutionId: metadata.institution.institution_id,
			accounts: metadata.accounts
		})
		.onConflictDoUpdate({
			target: [plaid.userId, plaid.institutionId],
			set: { cursor: '', accessToken: tokenResponse.data.access_token, accounts: metadata.accounts }
		});

	return json({ success: true });
};
