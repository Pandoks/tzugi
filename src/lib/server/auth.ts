import { type RequestEvent } from '@sveltejs/kit';

export const findUser = async (event: RequestEvent) => {
	const access_token = event.request.headers.get('authorization')?.split(' ')[1];

	if (!access_token) {
		const {
			data: { user }
		} = await event.locals.supabase.auth.getUser();
		if (!user) {
			return null;
		}
		return user;
	}

	const {
		data: { user }
	} = event.locals.supabase.auth.getUser(access_token);
	if (!user) {
		return null;
	}
	return user;
};
