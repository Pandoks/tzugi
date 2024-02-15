import { dev } from '$app/environment';
import { luciaAdapter } from '$lib/db';
import { Lucia } from 'lucia';

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
