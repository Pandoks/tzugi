<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import type { PageData } from './$types';
	import LoginForm from './login-form.svelte';

	export let data: PageData;
</script>

<div class="flex justify-center items-center h-screen">
	<Card.Root class="w-[350px]">
		<Card.Header>
			<Card.Title>Login</Card.Title>
		</Card.Header>
		<Card.Content>
			<LoginForm data={data.form} />
		</Card.Content>
	</Card.Root>
</div>
