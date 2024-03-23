import vision from '@google-cloud/vision';
import { blobToBuffer } from '../utils';

const googleVisionClient = new vision.ImageAnnotatorClient();

export const detectWordsFromImage = async (image: Blob) => {
	const [result] = await googleVisionClient.textDetection(await blobToBuffer(image));
	const detections = result.textAnnotations;
	if (!detections) {
		return { data: null, error: 'No text detected' };
	}
	const text = detections[0].description;
	return { data: text, error: null };
};
