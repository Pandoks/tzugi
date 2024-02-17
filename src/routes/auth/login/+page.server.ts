import { dev } from '$app/environment';
import { db } from '$lib/db';
import { deviceCookies, loginTimeouts, users } from '$lib/db/schema';
import { isValidDeviceCookie, lucia } from '$lib/server/auth';
import { emailSchema, passwordSchema, usernameSchema } from '$lib/server/validation';
import { fail, type Actions, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { alphabet, generateRandomString } from 'oslo/crypto';
import { Argon2id } from 'oslo/password';

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();

		// login throttling (prevent brute force/DOS)
		const storedDeviceCookieId = event.cookies.get('device_cookie') ?? null;
		const validDeviceCookie = isValidDeviceCookie(
			storedDeviceCookieId,
			formData.get('username') as string,
			5
		);
		if (!validDeviceCookie) {
			event.cookies.set('device_cookie', '', {
				path: '/',
				secure: !dev,
				maxAge: 0,
				httpOnly: true
			});
			const storedTimeout = (
				await db
					.select()
					.from(loginTimeouts)
					.where(
						and(
							eq(loginTimeouts.username, formData.get('username') as string),
							eq(loginTimeouts.ip, event.getClientAddress())
						)
					)
					.limit(1)
			)[0];
			const timeoutUntil = storedTimeout?.timeoutUntil ?? 0;
			if (Date.now() < timeoutUntil) {
				return fail(429);
			}

			const timeoutSeconds = storedTimeout ? storedTimeout.timeoutSeconds * 2 : 1;
			try {
				await db
					.insert(loginTimeouts)
					.values({
						username: formData.get('username') as string,
						ip: event.getClientAddress(),
						timeoutUntil: Date.now() + timeoutSeconds * 1000,
						timeoutSeconds: timeoutSeconds
					})
					.onConflictDoUpdate({
						target: [loginTimeouts.username, loginTimeouts.ip],
						set: {
							timeoutUntil: Date.now() + timeoutSeconds * 1000,
							timeoutSeconds: timeoutSeconds
						}
					});
			} catch {
				return fail(400, {
					message: 'Database insertion error'
				});
			}
		}

		// handle login
		if (
			!usernameSchema.safeParse(formData.get('username')).success ||
			!emailSchema.safeParse(formData.get('email')).success ||
			!passwordSchema.safeParse(formData.get('password')).success
		) {
			return fail(400, {
				message: 'Invalid username or password'
			});
		}

		const username = formData.get('username') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		const dbUserQuery = await db
			.select()
			.from(users)
			.where(and(eq(users.username, username), eq(users.email, email)))
			.limit(1);
		if (dbUserQuery.length === 0) {
			return fail(400, {
				message: 'Incorrect username or email or password'
			});
		}

		const existingUser = dbUserQuery[0];

		const validPassword = await new Argon2id().verify(existingUser.hashedPassword, password);
		if (!validPassword) {
			return fail(400, {
				message: 'Incorrect username or password'
			});
		}

		if (!validDeviceCookie) {
			try {
				// delete login throttling after successful login
				await db
					.delete(loginTimeouts)
					.where(
						and(
							eq(loginTimeouts.ip, event.getClientAddress()),
							eq(loginTimeouts.username, username)
						)
					);
			} catch {
				return fail(400, {
					message: 'Database deletion error'
				});
			}
		}

		// set device cookie after successful login (handles if device should login throttle during login)
		const newDeviceCookieId = generateRandomString(40, alphabet('a-z', 'A-Z', '0-9'));
		try {
			await db
				.insert(deviceCookies)
				.values({ id: newDeviceCookieId, username: username, attempts: 0 });
		} catch {
			return fail(400, {
				message: 'Database insertion error'
			});
		}
		event.cookies.set('device_cookie', newDeviceCookieId, {
			path: '/',
			secure: !dev,
			maxAge: 60 * 60 * 24 * 365, // 1 year
			httpOnly: true
		});

		// set session cookie after successful login (handles if user is logged in or not)
		const session = await lucia.createSession(existingUser.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		return redirect(302, '/');
	}
};
