<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { verifyEmailFormSchema, type VerifyEmailFormSchema } from '$lib/validation';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import type { PageData } from './$types';
	import { zodClient } from 'sveltekit-superforms/adapters';

	export let data: PageData;
	export let dataForm: SuperValidated<Infer<VerifyEmailFormSchema>> = data.form;
	const form = superForm(dataForm, {
		validators: zodClient(verifyEmailFormSchema)
	});
	const { form: formData, enhance } = form;
</script>

<div class="flex justify-center items-center h-screen">
	<Card.Root class="w-[350px]">
		<form method="POST" use:enhance>
			<Card.Header>
				<Card.Title>Email Verification</Card.Title>
			</Card.Header>
			<Card.Content>
				<Form.Field {form} name="code">
					<Form.Control let:attrs>
						<Form.Label>Verification Code</Form.Label>
						<Input {...attrs} bind:value={$formData.code} />
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
