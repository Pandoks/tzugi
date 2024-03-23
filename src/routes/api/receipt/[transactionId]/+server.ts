import { db } from '$lib/db';
import { transactions } from '$lib/db/schema';
import { json, type RequestHandler } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

export const DELETE: RequestHandler = async (event) => {
	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();

	const { transactionId } = event.params;

	await db
		.delete(transactions)
		.where(and(eq(transactions.userId, user.id), eq(transactions.id, transactionId!)));

	return json({ success: true });
};
