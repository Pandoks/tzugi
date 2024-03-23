import vision from '@google-cloud/vision';

const googleVisionClient = new vision.ImageAnnotatorClient();

export const detectWordsFromImage = async (image: Buffer) => {
	const [result] = await googleVisionClient.textDetection(image);
	const detections = result.textAnnotations;
	if (!detections) {
		return { data: null, error: 'No text detected' };
	}
	const text = detections[0].description;
	return { data: text, error: null };
};
