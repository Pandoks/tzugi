import { relations } from 'drizzle-orm';
import {
	foreignKey,
	json,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
	varchar
} from 'drizzle-orm/pg-core';
import { type Transaction } from 'plaid';

export const users = pgTable('users', {
	id: uuid('id').primaryKey().notNull()
});

export const usersRelations = relations(users, ({ many }) => ({
	institutions: many(plaid),
	transactions: many(transactions)
}));

export const plaid = pgTable(
	'plaid',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id),
		cursor: text('cursor').default(''),
		accessToken: text('access_token').notNull().unique(),
		institutionId: text('institution_id').notNull(),
		accounts: json('accounts').notNull()
	},
	(table) => {
		return { pk: primaryKey({ columns: [table.userId, table.institutionId] }) };
	}
);

export const transactions = pgTable(
	'transactions',
	{
		id: varchar('id').primaryKey().notNull(),
		userId: uuid('user_id').notNull(),
		institutionId: text('institution_id').notNull(),
		timestamp: timestamp('timestamp', { mode: 'date', withTimezone: true }),
		data: json('data').notNull().$type<Transaction>(),
		imagePath: text('image_path').notNull().default('')
	},
	(table) => {
		return {
			plaidReference: foreignKey({
				columns: [table.userId, table.institutionId],
				foreignColumns: [plaid.userId, plaid.institutionId]
			})
		};
	}
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
	user: one(users, {
		fields: [transactions.userId],
		references: [users.id]
	}),
	institution: one(plaid, {
		fields: [transactions.userId, transactions.institutionId],
		references: [plaid.userId, plaid.institutionId]
	})
}));
