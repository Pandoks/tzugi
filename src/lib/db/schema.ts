import { relations } from 'drizzle-orm';
import { json, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: uuid('id').primaryKey().notNull()
});

export const usersRelations = relations(users, ({ many }) => ({
	institutions: many(plaid),
	transactions: many(transactions)
}));

export const plaid = pgTable('plaid', {
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id)
		.primaryKey(),
	cursor: text('cursor').default(''),
	accessToken: text('access_token')
});

export const plaidRelations = relations(plaid, ({ one }) => ({
	user: one(users, {
		fields: [plaid.userId],
		references: [users.id]
	})
}));

export const transactions = pgTable('transactions', {
	id: varchar('id').primaryKey().notNull(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id),
	timestamp: timestamp('timestamp', { mode: 'date', withTimezone: true }),
	data: json('data').notNull(),
	imagePath: text('image_path').notNull().default('')
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
	user: one(users, {
		fields: [transactions.userId],
		references: [users.id]
	})
}));
