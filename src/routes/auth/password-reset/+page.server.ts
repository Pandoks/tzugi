import { db } from '$lib/db';
import { timeouts, users } from '$lib/db/schema';
import { createPasswordResetToken } from '$lib/server/auth';
import { sendPasswordResetToken } from '$lib/server/email';
import { emailSchema } from '$lib/server/validation';
import { fail, type Actions } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { HOST } from '$env/static/private';

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();

		// password reset throttling based on ip
		const ip = event.locals.ip;
		const valid = await db.transaction(async (tx) => {
			const [timeout] = await tx
				.select()
				.from(timeouts)
				.where(and(eq(timeouts.ip, ip), eq(timeouts.type, 'password-reset')))
				.limit(1);
			const timeoutUntil = timeout?.timeoutUntil ?? 0;
			if (Date.now() < timeoutUntil) {
				return false;
			}

			const timeoutSeconds = timeout ? timeout.timeoutSeconds * 5 : 1;
			await tx
				.insert(timeouts)
				.values({
					ip: ip,
					type: 'password-reset',
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
			return fail(429);
		}

		// or find the user by their cookie if they're logged in already
		if (!emailSchema.safeParse(formData.get('email')).success) {
			return fail(400, {
				message: 'Invalid email'
			});
		}

		const email = formData.get('email') as string;
		const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
		if (!user || !user.emailVerified) {
			return fail(400, {
				message: 'Invalid email'
			});
		}

		const verificationToken = await createPasswordResetToken(user.id);
		const verificationLink = HOST + verificationToken;

		await sendPasswordResetToken(email, verificationLink);
		return new Response(null, {
			status: 200
		});
	}
};
