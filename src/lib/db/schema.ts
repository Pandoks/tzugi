import { json, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: uuid('id').primaryKey().notNull()
});

export const plaid = pgTable('plaid', {
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id)
		.primaryKey(),
	cursor: text('cursor'),
	accessToken: text('access_token')
});

export const transactions = pgTable('transactions', {
	id: uuid('id').primaryKey().notNull().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id),
	timestamp: timestamp('timestamp', { withTimezone: true }),
	data: json('data'),
	imagePath: text('image_path')
});
