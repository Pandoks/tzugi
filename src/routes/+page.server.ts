import { fail, redirect, type Actions } from '@sveltejs/kit';

export const actions: Actions = {
  default: async ({ request, url, locals: { supabase } }) => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return fail(500, { message: 'Server error. Try again later.', success: false });
    }

    return redirect(301, '/login');
  }
};
