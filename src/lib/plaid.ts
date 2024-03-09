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

export const updatePlaidDatabase = async ({
	added,
	modified,
	removed,
	userId
}: {
	added: Transaction[];
	modified: Transaction[];
	removed: RemovedTransaction[];
	userId: string;
}) => {
	for (const addedTransaction of added) {
		await db
			.insert(transactions)
			.values({
				id: addedTransaction.transaction_id,
				userId: userId,
				timestamp: new Date(addedTransaction.authorized_date!),
				data: addedTransaction,
				imagePath: ''
			})
			.onConflictDoNothing();
	}

	for (const modifiedTransaction of modified) {
		await db
			.update(transactions)
			.set({
				data: modifiedTransaction
			})
			.where(eq(transactions.id, modifiedTransaction.transaction_id));
	}

	for (const removedTransaction of removed) {
		await db.delete(transactions).where(eq(transactions.id, removedTransaction.transaction_id!));
	}
};
