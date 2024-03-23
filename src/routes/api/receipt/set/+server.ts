import { db } from '$lib/db';
import { transactions } from '$lib/db/schema';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async (event) => {
	// TODO: protect this route with auth
	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();

	const formData = Object.fromEntries(await event.request.formData());
	if (!(formData.fileUpload as File).name || (formData.fileUpload as File).name === 'undefined') {
		return error(400, {
			message: 'You must provide a file to upload'
		});
	}

	const { fileUpload, transactionId } = formData as { fileUpload: File; transactionId: string };
	const filePath = `${user!.id}/${new Date().getTime()}.${fileUpload.name.split('.').pop()}`;
	const imageBuffer = Buffer.from(await fileUpload.arrayBuffer());

	const { data, err } = await event.locals.supabase.storage
		.from('receipts')
		.upload(filePath, new Uint8Array(imageBuffer), {
			cacheControl: '3600',
			upsert: true,
			contentType: `image/${fileUpload.name.split('.').pop()}`
		});

	if (err) {
		return error(500, "Couldn't upload to server");
	}

	const [transaction] = await db
		.select()
		.from(transactions)
		.where(eq(transactions.userId, user.id))
		.limit(1);

	if (transaction.imagePath !== '') {
		event.locals.supabase.storage
			.from('receipts')
			.remove([transaction.imagePath.substring(transaction.imagePath.indexOf('/') + 1)]);
	}

	await db
		.update(transactions)
		.set({ imagePath: data.fullPath })
		.where(eq(transactions.id, transactionId));

	return json({ success: true });
};
