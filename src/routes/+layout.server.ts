import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad, LayoutServerLoadEvent } from './$types';

export const load: LayoutServerLoad = async (event: LayoutServerLoadEvent) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}
	return {
		user: event.locals.user
	};
};
