import { PLAID_PRODUCTS, PLAID_COUNTRY_CODES } from '$env/static/public';
import { plaid } from '$lib/plaid';
import { error, json } from '@sveltejs/kit';
import { CountryCode, Products } from 'plaid';

export const GET = async (event) => {
	const session = await event.locals.getSession();
	if (!session) {
		// the user is not signed in
		throw error(401, { message: 'Unauthorized' });
	}

	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();
	const request = {
		user: {
			client_user_id: user.id
		},
		client_name: 'Tzugi',
		products: [Products.Transactions],
		language: 'en',
		country_codes: [CountryCode.Us]
	};
	const tokenResponse = await plaid.linkTokenCreate(request);
	return json(tokenResponse.data);
};
