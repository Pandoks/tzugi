import { db } from '$lib/db';
import { passwordResets, users } from '$lib/db/schema';
import { lucia } from '$lib/server/auth';
import { passwordSchema } from '$lib/validation';
import { fail, type Actions, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { isWithinExpirationDate } from 'oslo';
import { Argon2id } from 'oslo/password';
import type { PageServerLoad, PageServerLoadEvent } from './$types';

export const load: PageServerLoad = async (event: PageServerLoadEvent) => {
	const verificationToken = event.params.slug;
	const [token] = await db
		.select()
		.from(passwordResets)
		.where(eq(passwordResets.id, verificationToken))
		.limit(1);
	if (!token) return redirect(302, '/auth/login');
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();

		if (!passwordSchema.safeParse(formData.get('new-password')).success) {
			return fail(404);
		}

		const newPassword = formData.get('new-password') as string;
		const verificationToken = event.params.slug;
		if (!verificationToken) {
			return fail(404);
		}

		let token: { id: string; userId: string; expiresAt: Date } | undefined;
		await db.transaction(async (tx) => {
			[token] = await tx
				.select()
				.from(passwordResets)
				.where(eq(passwordResets.id, verificationToken))
				.limit(1);
			if (token) {
				await tx.delete(passwordResets).where(eq(passwordResets.id, verificationToken));
			}
		});
		if (!token || !isWithinExpirationDate(token.expiresAt)) {
			return fail(400);
		}

		await lucia.invalidateUserSessions(token.userId);
		const hashedPassword = await new Argon2id().hash(newPassword);
		await db
			.update(users)
			.set({ hashedPassword: hashedPassword })
			.where(eq(users.id, token.userId));

		const session = await lucia.createSession(token.userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		return redirect(302, '/');
	}
};
