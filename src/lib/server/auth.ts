import { dev } from '$app/environment';
import { db, luciaAdapter } from '$lib/db';
import { deviceCookies, passwordResets } from '$lib/db/schema';
import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { Lucia, generateId } from 'lucia';
import { TimeSpan, createDate } from 'oslo';

export const lucia = new Lucia(luciaAdapter, {
	sessionCookie: {
		attributes: {
			secure: !dev
		}
	},
	getUserAttributes: (attributes) => {
		return {
			username: attributes.username,
			email: attributes.email,
			emailVerified: attributes.email_verified
		};
	}
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

interface DatabaseUserAttributes {
	username: string;
	email: string;
	email_verified: boolean;
}

export const createPasswordResetToken = async (userId: string): Promise<string> => {
	return await db.transaction(async (tx) => {
		// invalidate all existing tokens (only one password reset token)
		await tx.delete(passwordResets).where(eq(passwordResets.userId, userId));

		const tokenId = generateId(40);
		await tx
			.insert(passwordResets)
			.values({ id: tokenId, userId: userId, expiresAt: createDate(new TimeSpan(1, 'h')) });

		return tokenId;
	});
};

export const isValidDeviceCookie = async (
	deviceCookieId: string | null,
	username: string,
	attemptsBeforeThrottle: number = 5
) => {
	if (!deviceCookieId) return false;

	const [deviceCookieAttributes] = await db
		.select()
		.from(deviceCookies)
		.where(eq(deviceCookies.id, deviceCookieId))
		.limit(1);
	if (!deviceCookieAttributes) {
		return false;
	}

	const currentAttempts = deviceCookieAttributes.attempts + 1;
	if (currentAttempts > attemptsBeforeThrottle || deviceCookieAttributes.username !== username) {
		await db.delete(deviceCookies).where(eq(deviceCookies.id, deviceCookieId));
		return false;
	}

	await db
		.insert(deviceCookies)
		.values({
			id: deviceCookieId,
			username: username,
			attempts: currentAttempts
		})
		.onConflictDoUpdate({
			target: [deviceCookies.id, deviceCookies.username],
			set: { attempts: currentAttempts }
		});

	return true;
};
