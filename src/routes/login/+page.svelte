<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import type { PageData } from './$types';
	import { loginFormSchema, type LoginFormSchema } from '$lib/validation';
	import { zodClient } from 'sveltekit-superforms/adapters';

	export let data: PageData;
	const dataForm: SuperValidated<Infer<LoginFormSchema>> = data.form;
	const form = superForm(dataForm, {
		validators: zodClient(loginFormSchema)
	});
	const { form: formData, enhance } = form;
</script>

<div class="flex justify-center items-center h-screen">
	<Card.Root class="w-[350px]">
		<form method="post" use:enhance>
			<Card.Header>
				<Card.Title>Login</Card.Title>
			</Card.Header>
			<Card.Content>
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
