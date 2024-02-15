import { defineConfig } from 'drizzle-kit';

const DB_CONNECTION_STRING = process.env.DB_CONNECTION_STRING;

if (!DB_CONNECTION_STRING) {
	throw new Error('DB_CONNECTION_STRING is required');
}

export default defineConfig({
	schema: './src/lib/db/schema.ts',
	driver: 'pg',
	dbCredentials: {
		connectionString: DB_CONNECTION_STRING
	},
	verbose: true,
	strict: true
});
