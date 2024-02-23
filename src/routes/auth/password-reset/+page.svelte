<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { passwordResetEmailFormSchema, type PasswordResetEmailFormSchema } from '$lib/validation';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import type { PageData } from './$types';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { Input } from '$lib/components/ui/input';

	export let data: PageData;
	export let dataForm: SuperValidated<Infer<PasswordResetEmailFormSchema>> = data.form;
	const form = superForm(dataForm, {
		validators: zodClient(passwordResetEmailFormSchema)
	});
	const { form: formData, enhance } = form;
</script>

<div class="flex justify-center items-center h-screen">
	<Card.Root class="w-[350px]">
		<form method="post" use:enhance>
			<Card.Header>
				<Card.Title>Password Reset</Card.Title>
			</Card.Header>
			<Card.Content>
				<Form.Field {form} name="email">
					<Form.Control let:attrs>
						<Form.Label>Email</Form.Label>
						<Input {...attrs} bind:value={$formData.email} />
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
