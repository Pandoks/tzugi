import { db } from '$lib/db';
import { timeouts, users } from '$lib/db/schema';
import { lucia } from '$lib/server/auth';
import { verifyVerificationCode } from '$lib/server/email';
import { fail, type Actions, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { PageServerLoad, PageServerLoadEvent } from './$types';
import { createDate, isWithinExpirationDate } from 'oslo';
import { TimeSpan } from 'lucia';

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

		// email verification throttling based on ip
		const ip = event.getClientAddress();
		const valid = await db.transaction(async (tx) => {
			const [timeout] = await tx
				.select()
				.from(timeouts)
				.where(and(eq(timeouts.ip, ip), eq(timeouts.type, 'email-verification')))
				.limit(1);
			const timeoutUntil = timeout?.timeoutUntil ?? 0;
			if (Date.now() < timeoutUntil) {
				return false;
			}

			const timeoutSeconds = timeout ? timeout.timeoutSeconds * 2 : 1;
			await tx
				.insert(timeouts)
				.values({
					ip: ip,
					type: 'email-verification',
					timeoutUntil: Date.now() + timeoutSeconds * 1000,
					timeoutSeconds: timeoutSeconds,
					expiresAt: createDate(new TimeSpan(1, 'h'))
				})
				.onConflictDoUpdate({
					target: [timeouts.ip, timeouts.type],
					set: {
						timeoutUntil: Date.now() + timeoutSeconds * 1000,
						timeoutSeconds: timeoutSeconds
					}
				});
			return true;
		});
		if (!valid) {
			return fail(429);
		}

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

		// delete throttle after an hour
		await db.transaction(async (tx) => {
			const [timeout] = await tx
				.select()
				.from(timeouts)
				.where(and(eq(timeouts.ip, ip), eq(timeouts.type, 'email-verification')))
				.limit(1);
			if (timeout && !isWithinExpirationDate(timeout.expiresAt!)) {
				tx.delete(timeouts).where(
					and(eq(timeouts.ip, ip), eq(timeouts.type, 'email-verification'))
				);
			}
		});

		const session = await lucia.createSession(user.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		return redirect(302, '/');
	}
};
