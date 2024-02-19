import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { lucia } from '$lib/server/auth';
import { verifyVerificationCode } from '$lib/server/email';
import { fail, type Actions, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad, PageServerLoadEvent } from './$types';

export const load: PageServerLoad = async (event: PageServerLoadEvent) => {
	if (!event.locals.user) {
		return redirect(302, '/auth/login');
	} else if (event.locals.user.emailVerified) {
		return redirect(302, '/');
	}

	return { username: event.locals.user.username };
};

export const actions: Actions = {
	default: async (event) => {
		const user = event.locals.user;
		if (!user) {
			return fail(401);
		}

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
