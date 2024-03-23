import { db } from '$lib/db';
import {
	receiptFeatureExtraction,
	receiptTransactionSimilarity,
	type ReceiptFeatures
} from '$lib/server/receipt-feature-extraction';
import { error, fail, json, type Actions } from '@sveltejs/kit';
import { transactions } from '$lib/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export const actions: Actions = {
	default: async (event) => {
		const {
			data: { user }
		} = await event.locals.supabase.auth.getUser();
		const formData = Object.fromEntries(await event.request.formData());

		if (!(formData.fileUpload as File).name || (formData.fileUpload as File).name === 'undefined') {
			return fail(400, {
				error: true,
				message: 'You must provide a file to upload'
			});
		}

		const { fileUpload } = formData as { fileUpload: File };
		const receiptFeatures = await receiptFeatureExtraction(fileUpload);
		let receiptFeaturesJson: ReceiptFeatures;
		try {
			receiptFeaturesJson = JSON.parse(receiptFeatures);
		} catch (err) {
			return error(500, "Couldn't parse data");
		}

		const transactionsQuery = await db
			.select()
			.from(transactions)
			.where(eq(transactions.userId, user.id))
			.orderBy(desc(transactions.timestamp));

		let similarityList = [];
		for (let index = 0; index < transactionsQuery.length; index++) {
			const similarity = receiptTransactionSimilarity({
				receipt: receiptFeaturesJson,
				transaction: transactionsQuery[index].data
			});
			similarityList.push({ transaction: transactionsQuery[index], similarity: similarity });
		}

		const WEIGHTS = { total: 10, date: 10, card: 3, channel: 1 };

		const weightedSums = similarityList.map((similarity) => ({
			...similarity,
			weightedSum:
				similarity.similarity.total * WEIGHTS.total +
				similarity.similarity.date * WEIGHTS.date +
				similarity.similarity.card * WEIGHTS.card +
				similarity.similarity.channel * WEIGHTS.channel
		}));

		const mostSimilar = weightedSums.reduce((min, obj) =>
			min.weightedSum < obj.weightedSum ? min : obj
		);

		const [transaction] = await db
			.select()
			.from(transactions)
			.where(eq(transactions.id, mostSimilar.transaction.id))
			.limit(1);
		if (transaction.imagePath !== '') {
			return json({
				success: false,
				message: 'Receipt already exists for its matched transaction',
				transactionId: mostSimilar.transaction.id
			});
		}
		// TODO: catch by front end and hit api endpoint to replace image if user answers yes replace
		// API endpoint to upload and replace transaction
		// Have spinner where it shows user that the image is being matched

		const THRESHOLD_SUM = 24;
		if (mostSimilar.weightedSum > THRESHOLD_SUM) {
			return error(500, 'No transaction match found');
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

		await db
			.update(transactions)
			.set({ imagePath: data.fullPath })
			.where(eq(transactions.id, mostSimilar.transaction.id));

		return { success: true };
	}
};
