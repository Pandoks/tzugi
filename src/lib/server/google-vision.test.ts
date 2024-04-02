import { describe, test } from 'vitest';
import fs from 'fs';
import { detectFeaturesFromImage } from './google-vision';

describe('Extract features from receipt image', async () => {
	const imageFile = fs.readFileSync('examples/5d02c94582f07a3b07e60647723eadc3.jpg');

	test('Extract feature from example image', { timeout: 100000 }, async () => {
		const { businessName, date, total, text } = await detectFeaturesFromImage(
			imageFile,
			'image/jpeg'
		);
		console.log(businessName, date, total, text);
	});
});
