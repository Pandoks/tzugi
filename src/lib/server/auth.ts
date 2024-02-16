import { dev } from '$app/environment';
import { db, luciaAdapter } from '$lib/db';
import { passwordResets } from '$lib/db/schema';
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
	// invalidate all existing tokens
	await db.delete(passwordResets).where(eq(passwordResets.userId, userId));

	const tokenId = generateId(40);
	await db
		.insert(passwordResets)
		.values({ id: tokenId, userId: userId, expiresAt: createDate(new TimeSpan(1, 'h')) });

	return tokenId;
};
