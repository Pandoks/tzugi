import { json, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: uuid('id').primaryKey().notNull()
});

export const transactions = pgTable('transactions', {
	id: varchar('id').primaryKey().notNull(),
	user: uuid('user')
		.notNull()
		.references(() => users.id),
	timestamp: timestamp('timestamp', { withTimezone: true }),
	data: json('data'),
	imagePath: text('image_path')
});
