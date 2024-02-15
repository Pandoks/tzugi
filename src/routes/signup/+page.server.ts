import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { lucia } from '$lib/server/auth';
import { passwordSchema, usernameSchema } from '$lib/server/validation';
import { fail, type Actions, redirect } from '@sveltejs/kit';
import { generateId } from 'lucia';
import { Argon2id } from 'oslo/password';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/');
	}
	return {};
};

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

		const userId = generateId(15);
		const hashedPassword = await new Argon2id().hash(password);

		const dbInsert = await db
			.insert(users)
			.values({ id: userId, username: username, hashed_password: hashedPassword })
			.onConflictDoNothing()
			.returning();

		if (dbInsert.length === 0) {
			return fail(400, {
				message: 'Username already exists'
			});
		}

		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		return redirect(302, '/');
	}
};
