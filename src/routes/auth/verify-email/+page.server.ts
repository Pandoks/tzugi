import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { lucia } from '$lib/server/auth';
import { verifyVerificationCode } from '$lib/server/email';
import { fail, type Actions, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const actions: Actions = {
	default: async (event) => {
		if (!event.locals.user) {
			return fail(401);
		}
		const user = event.locals.user;

		const formData = await event.request.formData();
		const verificationCode = formData.get('verification-code');

		if (typeof verificationCode !== 'string' || !verifyVerificationCode(user, verificationCode)) {
			return fail(404);
		}

		await lucia.invalidateUserSessions(user.id);
		try {
			await db.update(users).set({ emailVerified: true }).where(eq(users.id, user.id));
		} catch {
			return fail(400, {
				message: 'Database error'
			});
		}

		const session = await lucia.createSession(user.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		return redirect(302, '/');
	}
};
