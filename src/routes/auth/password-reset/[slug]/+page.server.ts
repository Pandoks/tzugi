import { db } from '$lib/db';
import { passwordResets, users } from '$lib/db/schema';
import { lucia } from '$lib/server/auth';
import { passwordSchema } from '$lib/server/validation';
import { fail, type Actions, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { isWithinExpirationDate } from 'oslo';
import { Argon2id } from 'oslo/password';

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();

		if (!passwordSchema.safeParse(formData.get('new-password')).success) {
			return fail(404);
		}

		const newPassword = formData.get('new-password') as string;
		const verificationToken = event.params.slug;
		if (!verificationToken) {
			return fail(404, {
				message: 'Invalid password'
			});
		}

		const token = (
			await db
				.select()
				.from(passwordResets)
				.where(eq(passwordResets.id, verificationToken))
				.limit(1)
		)[0];
		if (!token || !isWithinExpirationDate(token.expiresAt)) {
			return fail(400);
		}

		try {
			await db.delete(passwordResets).where(eq(passwordResets.id, verificationToken));
		} catch {
			return fail(400, {
				message: 'Database deletion error'
			});
		}

		await lucia.invalidateUserSessions(token.userId);
		const hashedPassword = await new Argon2id().hash(newPassword);
		try {
			await db
				.update(users)
				.set({ hashedPassword: hashedPassword })
				.where(eq(users.id, token.userId));
		} catch {
			return fail(400, {
				message: 'Database update error'
			});
		}

		const session = await lucia.createSession(token.userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		return redirect(302, '/');
	}
};
