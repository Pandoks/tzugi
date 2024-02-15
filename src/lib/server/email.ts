import { db } from '$lib/db';
import { emailVerifications } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { TimeSpan, createDate } from 'oslo';
import { alphabet, generateRandomString } from 'oslo/crypto';

export const generateEmailVerificationCode = async (
	userId: string,
	email: string
): Promise<string> => {
	await db.delete(emailVerifications).where(eq(emailVerifications.userId, userId));
	const code = generateRandomString(8, alphabet('0-9'));
	await db.insert(emailVerifications).values({
		userId: userId,
		email: email,
		code: code,
		expiresAt: createDate(new TimeSpan(5, 'm')) // 5 minutes
	});

	return code;
};
