import { db } from '$lib/db';
import { transactions } from '$lib/db/schema';
import { json, type RequestHandler } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

export const POST: RequestHandler = async (event) => {
	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();

	const { transactionId } = await event.request.json();
	if (!transactionId) return json({ success: false, imagePath: '' });

	const [transaction] = await db
		.select()
		.from(transactions)
		.where(and(eq(transactions.id, transactionId), eq(transactions.userId, user.id)))
		.limit(1);

	return json({ success: true, imagePath: transaction.imagePath });
};
