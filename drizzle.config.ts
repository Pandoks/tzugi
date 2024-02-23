import { defineConfig } from 'drizzle-kit';

const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_DATABASE = process.env.DB_DATABASE;

console.log(DB_USERNAME, DB_PASSWORD, DB_HOST, DB_PORT, DB_DATABASE);

if (
	!DB_USERNAME ||
	DB_PASSWORD === undefined ||
	DB_PASSWORD === null ||
	!DB_HOST ||
	!DB_PORT ||
	!DB_DATABASE
) {
	throw new Error('env database variables are required');
}

export default defineConfig({
	schema: './src/lib/db/schema.ts',
	driver: 'pg',
	out: './migrations',
	dbCredentials: {
		user: DB_USERNAME,
		password: DB_PASSWORD,
		host: DB_HOST,
		port: parseInt(DB_PORT),
		database: DB_DATABASE
	},
	verbose: true,
	strict: true
});
