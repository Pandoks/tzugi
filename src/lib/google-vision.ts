import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import vision from '@google-cloud/vision';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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
	const [result] = await googleVisionClient.textDetection(
		'examples/5d02c94582f07a3b07e60647723eadc3.jpg'
	);
	const detections = result.textAnnotations;
	if (!detections) {
		return { data: null, error: 'No text detected' };
	}
	const text = detections[0].description;
	return { data: text, error };
};
