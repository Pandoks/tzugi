import { db } from '$lib/db';
import { receipts, transactions } from '$lib/db/schema';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const DELETE: RequestHandler = async (event) => {
	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();
	if (!user) {
		return error(400, {
			message: 'User unauthorized'
		});
	}
	const imageName = event.params.imageName;
	if (!imageName) {
		return error(500, 'No id');
	}
	const receiptId = `${user!.id}/${imageName}`;

	await db
		.update(transactions)
		.set({ imagePath: null })
		.where(eq(transactions.imagePath, receiptId));

	await db.delete(receipts).where(eq(receipts.imagePath, receiptId));

	return json({ success: true });
};
