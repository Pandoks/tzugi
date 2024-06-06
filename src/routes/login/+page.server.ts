import { fail, redirect, type Actions, type RequestEvent } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { loginFormSchema } from '$lib/validation';

export const load = async () => {
  return {
    form: await superValidate(zod(loginFormSchema))
  };
};

export const actions: Actions = {
  default: async (event) => {
    const formData = await event.request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { data, error } = await event.locals.supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        emailRedirectTo: `${event.url.origin}/auth/callback`
      }
    });

    console.log(data);

    if (error) {
      return fail(500, { message: 'Server error. Try again later.', success: false, email });
    }

    return redirect(301, '/');
  }
};
