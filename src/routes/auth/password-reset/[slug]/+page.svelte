<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import type { PageData } from './$types';
	import PasswordReset from './password-reset.svelte';

	export let data: PageData;
</script>

<div class="flex justify-center items-center h-screen">
	<Card.Root class="w-[350px]">
		<Card.Header>
			<Card.Title>Password Reset</Card.Title>
		</Card.Header>
		<Card.Content>
			<PasswordReset data={data.form} />
		</Card.Content>
	</Card.Root>
</div>
