<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import type { PageData } from './$types';
	import { zodClient, type Infer } from 'sveltekit-superforms/adapters';
	import { signupFormSchema, type SignupFormSchema } from '$lib/validation';

	export let data: PageData;
	export let dataForm: SuperValidated<Infer<SignupFormSchema>> = data.form;
	const form = superForm(dataForm, {
		validators: zodClient(signupFormSchema)
	});
	const { form: formData, enhance } = form;
</script>

<div class="flex justify-center items-center h-screen">
	<Card.Root class="w-[350px]">
		<form method="POST" use:enhance>
			<Card.Header>
				<Card.Title>Signup</Card.Title>
			</Card.Header>
			<Card.Content>
				<Form.Field {form} name="username">
					<Form.Control let:attrs>
						<Form.Label>Username</Form.Label>
						<Input {...attrs} bind:value={$formData.username} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="email">
					<Form.Control let:attrs>
						<Form.Label>Email</Form.Label>
						<Input {...attrs} bind:value={$formData.email} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="password">
					<Form.Control let:attrs>
						<Form.Label>Password</Form.Label>
						<Input {...attrs} bind:value={$formData.password} type="password" />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</Card.Content>
			<Card.Footer>
				<Form.Button>Submit</Form.Button>
			</Card.Footer>
		</form>
	</Card.Root>
</div>
