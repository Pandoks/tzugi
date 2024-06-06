import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async (event) => {
  let session = await event.locals.getSession();
  return {
    session
  };
};
