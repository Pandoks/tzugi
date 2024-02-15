import { emailCodeSchema } from '$lib/server/validation';
import { fail, type Actions } from '@sveltejs/kit';

export const actions: Actions = {
	default: async (event) => {
		if (!event.locals.user) {
			return fail(401);
		}
		const formData = await event.request.formData();
		const verificationCode = formData.get('verification-code');
		if (!emailCodeSchema.safeParse(verificationCode).success) {
			return fail(400);
		}
	}
};
