import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { createPasswordResetToken } from '$lib/server/auth';
import { sendPasswordResetToken } from '$lib/server/email';
import { emailSchema } from '$lib/server/validation';
import { fail, type Actions } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();

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
		const verificationLink = 'http://localhost:3000/auth/reset-password/' + verificationToken;

		await sendPasswordResetToken(email, verificationLink);
		return new Response(null, {
			status: 200
		});
	}
};
