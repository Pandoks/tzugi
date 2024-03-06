import { plaid } from '$lib/plaid';
import { json } from '@sveltejs/kit';
import type { RemovedTransaction, Transaction, TransactionsSyncRequest } from 'plaid';

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
			access_token: 'access-production-a211a987-49a3-4d19-a3e3-6bbb8dec505d',
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
