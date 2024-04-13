import { plaid as plaidClient } from '$lib/server/plaid';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import type { RemovedTransaction, Transaction, TransactionsSyncRequest } from 'plaid';
import { db } from '$lib/db';
import { plaid, transactions as transactionsTable } from '$lib/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { findUser } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
	const user = await findUser(event);
	if (!user) {
		return error(400, {
			message: 'User unauthorized'
		});
	}
	const [{ cursor, accessToken, institutionId }] = await db
		.select()
		.from(plaid)
		.where(eq(plaid.userId, user.id));
	if (!accessToken || !cursor || !institutionId) {
		return error(400, { message: "Couldn't retrieve data from database" });
	}

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
			if (!response) {
				return error(400, {
					message: "Couldn't sync with plaid"
				});
			}
			const data = response.data;

			added = added.concat(data.added);
			modified = modified.concat(data.modified);
			removed = removed.concat(data.removed);

			hasMore = data.has_more;

			temporaryCursor = data.next_cursor;
		} catch (requestError: any) {
			if (
				requestError.response &&
				requestError.response.data &&
				requestError.response.data.error_code === 'ITEM_LOGIN_REQUIRED'
			) {
				// Need to go through Plaid link again for that specific bank account
				// TODO: Make frontend intercept this
				// Fix storing dates in database (Check the timezones)
				return json(
					{ error: 'ITEM_LOGIN_REQUIRED', message: requestError.response.data.error_message },
					{ status: 400 }
				);
			} else {
				return error(500);
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
				data: addedTransaction
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
	transactions.sort(
		(firstTransaction, secondTransaction) =>
			new Date(secondTransaction.date).getTime() - new Date(firstTransaction.date).getTime()
	);

	return json({ transactions: transactions });
};
