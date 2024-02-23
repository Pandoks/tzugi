import { db } from '$lib/db';
import { timeouts, users } from '$lib/db/schema';
import { createPasswordResetToken } from '$lib/server/auth';
import { sendPasswordResetToken } from '$lib/server/email';
import { emailSchema } from '$lib/server/validation';
import { fail, type Actions } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { createDate, isWithinExpirationDate } from 'oslo';
import { TimeSpan } from 'lucia';

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();

		// password reset throttling based on ip
		const ip = event.getClientAddress();
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
		// delete throttle after an hour
		await db.transaction(async (tx) => {
			const [timeout] = await tx
				.select()
				.from(timeouts)
				.where(and(eq(timeouts.ip, ip), eq(timeouts.type, 'password-reset')))
				.limit(1);
			if (timeout && !isWithinExpirationDate(timeout.expiresAt!)) {
				tx.delete(timeouts).where(and(eq(timeouts.ip, ip), eq(timeouts.type, 'password-reset')));
			}
		});

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
		const verificationLink = event.url.origin + '/auth/password-reset/' + verificationToken;
		console.log(verificationLink);

		await sendPasswordResetToken(email, verificationLink);
		return { success: true };
	}
};
