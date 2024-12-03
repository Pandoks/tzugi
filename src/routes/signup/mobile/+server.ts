import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async (event) => {
  const { email, password } = await event.request.json();
  const { data, error } = await event.locals.supabase.auth.signUp({
    email,
    password
  });
  console.log('Result from signUp!', data);
  const { user, session } = data;
  if (error) {
    console.log('Supabase error:', error);
    return json({ message: 'Supabase error. Try again later.', success: false });
  }
  try {
    await db.insert(users).values({ id: user.id });
  } catch (dbError) {
    return json({ message: 'Server error. Try again later.', success: false });
  }

  return json({
    success: true,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    user: {
      id: user.id,
      email: email
    }
  });
};
