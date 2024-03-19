import { plaid as plaidClient } from '$lib/plaid';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import type { RemovedTransaction, Transaction, TransactionsSyncRequest } from 'plaid';
import { db } from '$lib/db';
import { plaid, transactions as transactionsTable } from '$lib/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export const GET: RequestHandler = async (event) => {
	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();
	const [{ cursor, accessToken, institutionId }] = await db
		.select()
		.from(plaid)
		.where(eq(plaid.userId, user.id));
	if (!accessToken) return error(404);

	let temporaryCursor = cursor;

	// new transaction updates since cursor
	let added: Array<Transaction> = [];
	let modified: Array<Transaction> = [];
	let removed: Array<RemovedTransaction> = [];

	let hasMore = true; // transactions are sent paginated
	while (hasMore) {
		try {
			const request: TransactionsSyncRequest = {
				access_token: accessToken,
				cursor: temporaryCursor!
			};
			const response = await plaidClient.transactionsSync(request);
			const data = response.data;

			added = added.concat(data.added);
			modified = modified.concat(data.modified);
			removed = removed.concat(data.removed);

			hasMore = data.has_more;

			temporaryCursor = data.next_cursor;
		} catch (error: any) {
			if (
				error.response &&
				error.response.data &&
				error.response.data.error_code === 'ITEM_LOGIN_REQUIRED'
			) {
				return json(
					{ error: 'ITEM_LOGIN_REQUIRED', message: error.response.data.error_message },
					{ status: 400 }
				);
			} else {
				return error(500, error.message || 'An unexpected error occurred');
			}
		}
	}

	// Update databases
	await db
		.update(plaid)
		.set({ cursor: temporaryCursor })
		.where(and(eq(plaid.userId, user.id), eq(plaid.institutionId, institutionId)));

	for (const addedTransaction of added) {
		await db
			.insert(transactionsTable)
			.values({
				id: addedTransaction.transaction_id,
				userId: user.id,
				institutionId: institutionId,
				timestamp: new Date(addedTransaction.authorized_date!),
				data: addedTransaction,
				imagePath: ''
			})
			.onConflictDoNothing();
	}
	for (const modifiedTransaction of modified) {
		await db
			.update(transactionsTable)
			.set({
				data: modifiedTransaction
			})
			.where(eq(transactionsTable.id, modifiedTransaction.transaction_id));
	}
	for (const removedTransaction of removed) {
		await db
			.delete(transactionsTable)
			.where(eq(transactionsTable.id, removedTransaction.transaction_id!));
	}

	const transactionsQuery = await db
		.select()
		.from(transactionsTable)
		.where(eq(transactionsTable.userId, user.id))
		.orderBy(desc(transactionsTable.timestamp));
	const transactions = transactionsQuery.map((transaction) => transaction.data);

	console.log('Transactions:', transactions);

	return json({ transactions: transactions });
};
