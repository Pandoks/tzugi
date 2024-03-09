import {
	Configuration,
	PlaidApi,
	PlaidEnvironments,
	type RemovedTransaction,
	type Transaction
} from 'plaid';
import { PLAID_CLIENT_ID, PLAID_SECRET } from '$env/static/private';
import { db } from './db';
import { plaid as plaidTable, transactions } from './db/schema';
import { eq } from 'drizzle-orm';

const configuration = new Configuration({
	basePath: PlaidEnvironments.production,
	baseOptions: {
		headers: {
			'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
			'PLAID-SECRET': PLAID_SECRET
		}
	}
});
export const plaid = new PlaidApi(configuration);
