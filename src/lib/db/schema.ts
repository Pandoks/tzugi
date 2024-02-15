import { boolean, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false),
	hashed_password: text('hashed_password').notNull()
});

export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	expiresAt: timestamp('expires_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull()
});

export const emailVerifications = pgTable('email_verifications', {
	id: serial('id').primaryKey(),
	code: text('code'),
	userId: text('user_id')
		.unique()
		.notNull()
		.references(() => users.id),
	email: text('email'),
	expiresAt: timestamp('expires_at', {
		withTimezone: true,
		mode: 'date'
	})
});
