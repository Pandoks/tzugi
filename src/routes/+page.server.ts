import { lucia } from '$lib/server/auth';
import { fail, type Actions, redirect } from '@sveltejs/kit';
import type { PageServerLoad, PageServerLoadEvent } from './$types';

export const load: PageServerLoad = async (event: PageServerLoadEvent) => {
	if (!event.locals.user) {
		return redirect(302, '/auth/login');
	}

	return { username: event.locals.user.username };
};

export const actions: Actions = {
	default: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}

		await lucia.invalidateSession(event.locals.session.id);
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		return redirect(302, '/auth/login');
	}
};
