import { plaid } from '$lib/plaid';
import { json } from '@sveltejs/kit';
import type { RemovedTransaction, Transaction, TransactionsSyncRequest } from 'plaid';
import { TEST_ACCESS_TOKEN } from '$env/static/private';

let CURSOR = '';
export const GET = async (event) => {
	let databaseCursor = CURSOR;
	let temporaryCursor = databaseCursor;

	// new transaction updates since cursor
	let added: Array<Transaction> = [];
	let modified: Array<Transaction> = [];
	let removed: Array<RemovedTransaction> = [];

	let hasMore = true; // transactions are sent paginated
	while (hasMore) {
		const request: TransactionsSyncRequest = {
			access_token: TEST_ACCESS_TOKEN,
			cursor: temporaryCursor
		};
		const response = await plaid.transactionsSync(request);
		const data = response.data;

		added = added.concat(data.added);
		modified = modified.concat(data.modified);
		removed = removed.concat(data.removed);

		hasMore = data.has_more;

		console.log(temporaryCursor);
		temporaryCursor = data.next_cursor;
	}
	added = [...added].sort((first, second) => {
		return Number(second.date > first.date) - Number(second.date < first.date);
	});

	return json({ added: added });
};
