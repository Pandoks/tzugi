import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sessions, users } from './schema';
import { DB_DATABASE, DB_HOST, DB_PASSWORD, DB_PORT, DB_USERNAME } from '$env/static/private';

if (
	!DB_DATABASE ||
	!DB_PORT ||
	!DB_HOST ||
	DB_PASSWORD === undefined ||
	DB_PASSWORD === null ||
	!DB_USERNAME
) {
	throw new Error('DB_CONNECTION_STRING is required');
}

const client = postgres({
	username: DB_USERNAME,
	password: DB_PASSWORD,
	host: DB_HOST,
	port: parseInt(DB_PORT),
	database: DB_DATABASE,
	prepare: false // add SSL when drizzle supports it
});
export const db = drizzle(client);

export const luciaAdapter = new DrizzlePostgreSQLAdapter(db, sessions, users);
