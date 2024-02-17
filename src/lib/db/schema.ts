import {
	bigint,
	boolean,
	integer,
	pgTable,
	primaryKey,
	serial,
	text,
	timestamp
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false),
	hashedPassword: text('hashed_password').notNull()
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
	code: text('code').notNull(),
	userId: text('user_id')
		.unique()
		.notNull()
		.references(() => users.id),
	email: text('email').notNull(),
	expiresAt: timestamp('expires_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull()
});

export const passwordResets = pgTable('password_resets', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	expiresAt: timestamp('expires_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull()
});

export const loginTimeouts = pgTable(
	'login_timeouts',
	{
		username: text('username')
			.notNull()
			.references(() => users.id),
		ip: text('ip').notNull(),
		timeoutUntil: bigint('timeout_until', { mode: 'number' }).notNull(),
		timeoutSeconds: bigint('timeout_seconds', { mode: 'number' }).notNull().default(0)
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.username, table.ip] })
		};
	}
);

export const deviceCookies = pgTable('device_cookies', {
	id: text('id').notNull(),
	username: text('username').notNull(),
	attempts: integer('attempts').default(0)
});
