import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV } from '$env/static/private';

const configuration = new Configuration({
	basePath: PlaidEnvironments[PLAID_ENV],
	baseOptions: {
		headers: {
			'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
			'PLAID-SECRET': PLAID_SECRET
		}
	}
});
export const plaid = new PlaidApi(configuration);
