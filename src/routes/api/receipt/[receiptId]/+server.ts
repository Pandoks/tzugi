import { db } from '$lib/db';
import { receipts, transactions } from '$lib/db/schema';
import { findUser } from '$lib/server/auth';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const DELETE: RequestHandler = async (event) => {
	const user = await findUser(event);
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
