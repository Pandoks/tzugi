import { db } from '$lib/db';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { receipts, transactions } from '$lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { detectFeaturesFromImage } from '$lib/server/google-vision';
import levenshtein from 'fast-levenshtein';
import type { Transaction } from 'plaid';

// TODO: REMEMBER TO ADD ORIGINS TO CORS FOR CSRF PROTECTION BEFORE PRODUCTION
export const POST: RequestHandler = async (event) => {
	const access_token = event.request.headers.get('authorization')?.split(' ')[1];
	if (!access_token) {
		return error(400, {
			message: 'User unauthorized'
		});
	}

	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser(access_token);
	if (!user) {
		return error(400, {
			message: 'User unauthorized'
		});
	}

	const formData = Object.fromEntries(await event.request.formData());

	if (!(formData.fileUpload as File)) {
		return error(400, {
			message: 'You must provide a file to upload'
		});
	}

	const { fileUpload } = formData as { fileUpload: File };
	const fileBuffer = Buffer.from(await fileUpload.arrayBuffer());
	const { businessName, date, total, text } = await detectFeaturesFromImage(
		fileBuffer,
		fileUpload.type
	);

	const transactionsQuery = await db
		.select()
		.from(transactions)
		.where(eq(transactions.userId, user.id))
		.orderBy(desc(transactions.timestamp));

	let mostSimilarTransaction: {
		transaction: Transaction;
		transactionSimilarity: number;
		dateSimilarity: number;
		businessNameSimilarity: number;
	} | null = null;
	const TRANSACTION_THRESHOLD = 0; // 0 means exact match
	const DATE_THRESHOLD = 0;
	const BUSINESS_NAME_THRESHOLD = 15;
	for (let index = 0; index < transactionsQuery.length; index++) {
		const transactionSimilarity = levenshtein.get(
			total,
			transactionsQuery[index].data.amount.toString()
		);
		const dateSimilarity = levenshtein.get(date, transactionsQuery[index].data.date);
		const businessNameSimilarity = levenshtein.get(
			businessName,
			transactionsQuery[index].data.merchant_name || ''
		);

		if (
			transactionSimilarity <= TRANSACTION_THRESHOLD &&
			dateSimilarity <= DATE_THRESHOLD &&
			businessNameSimilarity <= BUSINESS_NAME_THRESHOLD
		) {
			if (
				!mostSimilarTransaction ||
				(transactionSimilarity < mostSimilarTransaction.transactionSimilarity &&
					dateSimilarity < mostSimilarTransaction.dateSimilarity &&
					businessNameSimilarity < mostSimilarTransaction.businessNameSimilarity)
			) {
				mostSimilarTransaction = {
					transaction: transactionsQuery[index].data,
					transactionSimilarity: transactionSimilarity,
					dateSimilarity: dateSimilarity,
					businessNameSimilarity: businessNameSimilarity
				};
			}
		}
	}

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

	await db.insert(receipts).values({ imagePath: filePath, text: text, userId: user.id });

	if (!mostSimilarTransaction) {
		return json({ matched: false });
	}

	const [transaction] = await db
		.select()
		.from(transactions)
		.where(eq(transactions.id, mostSimilarTransaction.transaction.transaction_id))
		.limit(1);
	if (transaction.imagePath !== '') {
		return json({
			success: false,
			message: 'Receipt already exists for its matched transaction',
			transactionId: mostSimilarTransaction.transaction.transaction_id
		});
	}
	// TODO: catch by front end and hit api endpoint to replace image if user answers yes replace
	// API endpoint to upload and replace transaction
	// Have spinner where it shows user that the image is being matched

	await db
		.update(transactions)
		.set({ imagePath: data.fullPath })
		.where(eq(transactions.id, mostSimilarTransaction.transaction.transaction_id));

	return json({ matched: true });
};
