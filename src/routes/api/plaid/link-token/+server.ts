export const GET = (event) => {
	console.log('\n----- /api/link_token hit -----');
	try {
		const configs = {
			user: {
				client_user_id: 'user-id'
			},
			client_name: 'Plaid Quickstart',
			products: PLAID_PRODUCTS,
			country_codes: PLAID_COUNTRY_CODES,
			language: 'en'
		};
		const token_response = await plaid.linkTokenCreate(configs);
		console.log('Token response:\n', token_response.data);
		return res.json(token_response.data);
	} catch (error) {
		next(error);
	}
};
