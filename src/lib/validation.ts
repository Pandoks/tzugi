import { z } from 'zod';

export const usernameSchema = z
	.string()
	.min(4)
	.max(31)
	.regex(/^[a-zA-Z0-9_-]+$/);

export const passwordSchema = z.string().min(6).max(255);

export const emailSchema = z.string().email();

export const emailCodeSchema = z.string().max(6);

export const signupFormSchema = z.object({
	username: usernameSchema,
	email: emailSchema,
	password: passwordSchema
});
export type SignupFormSchema = typeof signupFormSchema;

export const loginFormSchema = z.object({
	username: usernameSchema,
	email: emailSchema,
	password: passwordSchema
});
export type LoginFormSchema = typeof loginFormSchema;

export const verifyEmailFormSchema = z.object({
	code: z.string()
});
export type VerifyEmailFormSchema = typeof verifyEmailFormSchema;

export const passwordResetEmailFormSchema = z.object({
	email: emailSchema
});
export type PasswordResetEmailFormSchema = typeof passwordResetEmailFormSchema;

export const passwordResetPasswordFormSchema = z.object({
	password: passwordSchema
});
export type PasswordResetPasswordFormSchema = typeof passwordResetPasswordFormSchema;
