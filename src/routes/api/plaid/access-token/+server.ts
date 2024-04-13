import { db } from '$lib/db';
import { plaid } from '$lib/db/schema';
import { findUser } from '$lib/server/auth';
import { plaid as plaidClient } from '$lib/server/plaid';
import { error, json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async (event) => {
	const user = await findUser(event);
	if (!user) {
		return error(400, {
			message: 'User unauthorized'
		});
	}

	const { public_token, metadata } = await event.request.json();
	if (!public_token || !metadata) {
		return error(400, {
			message: "Public Token or metadata wasn't supplied"
		});
	}

	const tokenResponse = await plaidClient.itemPublicTokenExchange({
		public_token: public_token
	});

	if (!tokenResponse) {
		return error(400, {
			message: "Couldn't exchange token"
		});
	}

	try {
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
				set: {
					cursor: '',
					accessToken: tokenResponse.data.access_token,
					accounts: metadata.accounts
				}
			});
	} catch (err) {
		return error(400, {
			message: 'Database failure'
		});
	}

	return json({ success: true });
};
