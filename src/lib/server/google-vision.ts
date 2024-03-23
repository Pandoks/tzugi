import vision from '@google-cloud/vision';
import { type SupabaseClient } from '@supabase/supabase-js';
import { blobToBuffer } from '../utils';

const googleVisionClient = new vision.ImageAnnotatorClient();

export const detectWordsFromImage = async ({
	storageFilePath,
	storageBucket,
	cloudClient
}: {
	storageFilePath: string;
	storageBucket: string;
	cloudClient: SupabaseClient;
}) => {
	const { data, error } = await cloudClient.storage.from(storageBucket).download(storageFilePath);
	if (error) {
		return { data: null, error };
	}
	const image = await blobToBuffer(data);
	const [result] = await googleVisionClient.textDetection(image);
	const detections = result.textAnnotations;
	if (!detections) {
		return { data: null, error: 'No text detected' };
	}
	const text = detections[0].description;
	return { data: text, error };
};
