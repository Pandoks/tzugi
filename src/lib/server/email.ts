import { db } from '$lib/db';
import { emailVerifications } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import type { User } from 'lucia';
import { TimeSpan, createDate, isWithinExpirationDate } from 'oslo';
import { alphabet, generateRandomString } from 'oslo/crypto';
import { emailCodeSchema } from './validation';

export const generateEmailVerificationCode = async (
	userId: string,
	email: string
): Promise<string> => {
	return await db.transaction(async (tx) => {
		await tx.delete(emailVerifications).where(eq(emailVerifications.userId, userId));

		const code = generateRandomString(6, alphabet('0-9', 'A-Z'));
		await tx.insert(emailVerifications).values({
			userId: userId,
			email: email,
			code: code,
			expiresAt: createDate(new TimeSpan(5, 'm')) // 5 minutes
		});

		return code;
	});
};

// TODO
export const sendVerificationCode = async (email: string, verificationCode: string) => {
	return;
};

export const verifyVerificationCode = async (user: User, code: string): Promise<boolean> => {
	const dbVerificationCodeQuery = await db
		.select()
		.from(emailVerifications)
		.where(eq(emailVerifications.userId, user.id))
		.limit(1);

	if (dbVerificationCodeQuery.length === 0) {
		return false;
	}

	const verificationCode = dbVerificationCodeQuery[0];
	if (
		!verificationCode.code ||
		verificationCode.code !== code ||
		!emailCodeSchema.safeParse(verificationCode.code).success
	) {
		return false;
	}

	await db.delete(emailVerifications).where(eq(emailVerifications.id, verificationCode.id));

	if (
		!isWithinExpirationDate(verificationCode.expiresAt) ||
		verificationCode.email !== user.email
	) {
		return false;
	}

	return true;
};

// TODO
export const sendPasswordResetToken = async (email: string, verificationLink: string) => {
	return;
};
