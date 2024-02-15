import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { lucia } from '$lib/server/auth';
import { passwordSchema, usernameSchema } from '$lib/server/validation';
import { fail, type Actions, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { Argon2id } from 'oslo/password';

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();

		if (
			!usernameSchema.safeParse(formData.get('username')).success ||
			!passwordSchema.safeParse(formData.get('password')).success
		) {
			return fail(400, {
				message: 'Invalid username or password'
			});
		}

		const username = formData.get('username') as string;
		const password = formData.get('password') as string;

		const existingUser = (
			await db.select().from(users).where(eq(users.username, username)).limit(1)
		)[0];
		if (!existingUser) {
			return fail(400, {
				message: 'Incorrect username or password'
			});
		}

		const validPassword = await new Argon2id().verify(existingUser.hashed_password, password);
		if (!validPassword) {
			return fail(400, {
				message: 'Incorrect username or password'
			});
		}

		const session = await lucia.createSession(existingUser.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		return redirect(302, '/');
	}
};
