import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './signup/$types';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}
	return {
		user: event.locals.user
	};
};
