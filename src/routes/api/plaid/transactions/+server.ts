import { plaid as plaidClient, updateTransactionDatabase } from '$lib/plaid';
import { error, json } from '@sveltejs/kit';
import type { RemovedTransaction, Transaction, TransactionsSyncRequest } from 'plaid';
import { db } from '$lib/db';
import { plaid } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = async (event) => {
	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();
	const [{ cursor, accessToken }] = await db.select().from(plaid).where(eq(plaid.userId, user.id));
	if (!accessToken) return error(404);

	let temporaryCursor = cursor;

	// new transaction updates since cursor
	let added: Array<Transaction> = [];
	let modified: Array<Transaction> = [];
	let removed: Array<RemovedTransaction> = [];

	let hasMore = true; // transactions are sent paginated
	while (hasMore) {
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
	}
	await db.update(plaid).set({ cursor: temporaryCursor }).where(eq(plaid.userId, user.id));
	await updateTransactionDatabase({
		added: added,
		modified: modified,
		removed: removed,
		userId: user.id
	});
	added = [...added].sort((first, second) => {
		return Number(second.date > first.date) - Number(second.date < first.date);
	});

	return json({ added: added });
};
