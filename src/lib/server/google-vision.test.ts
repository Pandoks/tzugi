import { test } from 'vitest';
import { detectWordsFromImage } from './google-vision';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';

const supabaseClient = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

test('Download file from supabase', async () => {
	const { data, error } = await detectWordsFromImage({
		storageFilePath: 'test/test.jpg',
		storageBucket: 'receipts',
		cloudClient: supabaseClient
	});
});
