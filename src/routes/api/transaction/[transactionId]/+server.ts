import { db } from '$lib/db';
import { receipts, transactions } from '$lib/db/schema';
import { detectFeaturesFromImage } from '$lib/server/google-vision';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const PATCH: RequestHandler = async (event) => {
	// TODO: protect this route with auth
	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();
	const transactionId = event.params.transactionId;
	if (!transactionId) {
		return error(500, 'No id');
	}

	const data = await event.request.json();

	const imagePath = data.imagePath;

	await db
		.update(transactions)
		.set({ imagePath: imagePath })
		.where(eq(transactions.id, transactionId!));

	return json({ success: true });
};

export const POST: RequestHandler = async (event) => {
	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();
	const transactionId = event.params.transactionId;
	if (!transactionId) {
		return error(500, 'No id');
	}

	const formData = Object.fromEntries(await event.request.formData());

	if (!(formData.fileUpload as File).name || (formData.fileUpload as File).name === 'undefined') {
		return error(400, {
			message: 'You must provide a file to upload'
		});
	}

	const { fileUpload } = formData as { fileUpload: File };
	const fileBuffer = Buffer.from(await fileUpload.arrayBuffer());
	const { text } = await detectFeaturesFromImage(fileBuffer, fileUpload.type);

	const filePath = `${user!.id}/${new Date().getTime()}.${fileUpload.name.split('.').pop()}`;
	const imageBuffer = Buffer.from(await fileUpload.arrayBuffer());

	const { data } = await event.locals.supabase.storage
		.from('receipts')
		.upload(filePath, new Uint8Array(imageBuffer), {
			cacheControl: '3600',
			upsert: true,
			contentType: `image/${fileUpload.name.split('.').pop()}`
		});

	await db.insert(receipts).values({ imagePath: filePath, text: text, userId: user.id });
	await db
		.update(transactions)
		.set({ imagePath: data.fullPath })
		.where(eq(transactions.id, transactionId));

	return json({ success: true });
};
