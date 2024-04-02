import visionOCR from '@google-cloud/vision';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import {
	DOCUMENTAI_PROJECT_ID,
	DOCUMENTAI_PROJECT_LOCATION,
	DOCUMENTAI_PROCESSOR_ID
} from '$env/static/private';

// TODO: Try Google Cloud Document AI API
const googleVisionClient = new visionOCR.ImageAnnotatorClient();
const googleDocumentAIClient = new DocumentProcessorServiceClient();

export const detectWordsFromImage = async (image: Buffer) => {
	const [result] = await googleVisionClient.textDetection(image);
	const detections = result.textAnnotations;
	if (!detections) {
		return { data: null, error: 'No text detected' };
	}
	const text = detections[0].description;
	return { data: text, error: null };
};

export type DocumentAIMimeType =
	| 'application/pdf'
	| 'image/tiff'
	| 'image/jpeg'
	| 'image/png'
	| 'image/bmp'
	| 'image/webp';

export const detectFeaturesFromImage = async (image: Buffer, mimeType: string) => {
	const name = `projects/${DOCUMENTAI_PROJECT_ID}/locations/${DOCUMENTAI_PROJECT_LOCATION}/processors/${DOCUMENTAI_PROCESSOR_ID}`;

	const request = {
		name,
		rawDocument: {
			content: image.toString('base64'),
			mimeType: mimeType
		}
	};

	const [result] = await googleDocumentAIClient.processDocument(request);
	const { document } = result;

	if (!document) {
		throw new Error('No features detected from image');
	}

	const { text, entities } = document;
	// TODO: store text in db to let you search

	if (!text || !entities) {
		throw new Error('No text or entities detected from image');
	}

	let transactionBusinessNames: Map<string, number> = new Map();
	let maxTransactionBusinessNameCount = 0;
	let mostFrequentTransactionBusinessName = '';
	let transactionDateTimes: Map<string, number> = new Map();
	let maxTransactionDateTimeCount = 0;
	let mostFrequentTransactionDateTime = '';
	let transactionPaymentTotals: Map<string, number> = new Map();
	let maxTransactionPaymentTotalCount = 0;
	let mostFrequentTransactionPaymentTotal = '';
	for (let index = 0; index < entities.length; index++) {
		const entity = entities[index];
		let count = 0;
		switch (entity.type) {
			case 'TransactionBusinessName':
				if (!entity.mentionText) {
					throw new Error('No transaction business name detected');
				}

				count = transactionBusinessNames.get(entity.mentionText) || 0;
				count++;

				if (count > maxTransactionBusinessNameCount) {
					maxTransactionBusinessNameCount = count;
					mostFrequentTransactionBusinessName = entity.mentionText;
				}

				transactionBusinessNames.set(entity.mentionText, count);
				break;
			case 'TransactionDatetime':
				if (!entity.normalizedValue || !entity.normalizedValue.text) {
					throw new Error('No transaction datetime detected');
				}

				count = transactionDateTimes.get(entity.normalizedValue.text) || 0;
				count++;

				if (count > maxTransactionDateTimeCount) {
					maxTransactionDateTimeCount = count;
					mostFrequentTransactionDateTime = entity.normalizedValue.text;
				}

				transactionDateTimes.set(entity.normalizedValue.text, count);
				break;
			case 'TransactionPaymentTotal':
				if (!entity.normalizedValue || !entity.normalizedValue.text) {
					throw new Error('No transaction payment total detected');
				}

				count = transactionPaymentTotals.get(entity.normalizedValue.text) || 0;
				count++;

				if (count > maxTransactionPaymentTotalCount) {
					maxTransactionDateTimeCount = count;
					mostFrequentTransactionPaymentTotal = entity.normalizedValue.text;
				}

				transactionPaymentTotals.set(entity.normalizedValue.text, count);
				break;
			default:
				throw new Error('Unknown entity type');
		}
	}

	const receiptFeatures = {
		businessName: mostFrequentTransactionBusinessName,
		date: mostFrequentTransactionDateTime,
		total: mostFrequentTransactionPaymentTotal,
		text: document.text
	};
	return receiptFeatures;
};
