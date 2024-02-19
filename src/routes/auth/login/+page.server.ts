import { dev } from '$app/environment';
import { db } from '$lib/db';
import { deviceCookies, timeouts, users } from '$lib/db/schema';
import { isValidDeviceCookie, lucia } from '$lib/server/auth';
import { emailSchema, passwordSchema, usernameSchema } from '$lib/server/validation';
import { fail, type Actions, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { alphabet, generateRandomString } from 'oslo/crypto';
import { Argon2id } from 'oslo/password';

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const ip = event.getClientAddress();
		console.log('ip:', ip);

		// login throttling based off of ip (prevent brute force/DOS)
		const storedDeviceCookieId = event.cookies.get('device_cookie') ?? null;
		const validDeviceCookie = await isValidDeviceCookie(
			storedDeviceCookieId,
			formData.get('username') as string,
			5
		);
		if (!validDeviceCookie) {
			console.log('Bad cookie');
			event.cookies.set('device_cookie', '', {
				path: '/',
				secure: !dev,
				maxAge: 0,
				httpOnly: true
			});
			console.log('Set cookie');
			const valid = await db.transaction(async (tx) => {
				const [storedTimeout] = await tx
					.select()
					.from(timeouts)
					.where(and(eq(timeouts.ip, ip), eq(timeouts.type, 'login')))
					.limit(1);
				console.log('query');
				const timeoutUntil = storedTimeout?.timeoutUntil ?? 0;
				if (Date.now() < timeoutUntil) {
					return false;
				}

				console.log('throttle');

				const timeoutSeconds = storedTimeout ? storedTimeout.timeoutSeconds * 2 : 1;
				await tx
					.insert(timeouts)
					.values({
						ip: ip,
						type: 'login',
						timeoutUntil: Date.now() + timeoutSeconds * 1000,
						timeoutSeconds: timeoutSeconds
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
				console.log('Too many request');
				return fail(429);
			}
		}

		console.log('Good cookie');

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

		const [existingUser] = await db
			.select()
			.from(users)
			.where(and(eq(users.username, username), eq(users.email, email)))
			.limit(1);
		if (!existingUser) {
			return fail(400, {
				message: 'Incorrect username or email or password'
			});
		}

		const validPassword = await new Argon2id().verify(existingUser.hashedPassword, password);
		if (!validPassword) {
			return fail(400, {
				message: 'Incorrect username or password'
			});
		}

		if (!validDeviceCookie) {
			try {
				// delete login throttling after successful login
				await db.delete(timeouts).where(and(eq(timeouts.ip, ip), eq(timeouts.type, 'login')));
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
