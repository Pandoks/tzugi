// src/routes/+layout.server.ts
export const load = async ({ locals: { getSession } }: any) => {
	return {
		session: await getSession()
	};
};
