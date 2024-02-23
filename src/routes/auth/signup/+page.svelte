<script lang="ts">
	import type { PageData } from './$types';
	import SignupForm from './signup-form.svelte';

	export let data: PageData;
</script>

<h1>Sign up</h1>
<!-- <form method="post" use:enhance> -->
<!-- 	<label for="username">Username</label> -->
<!-- 	<input type="text" name="username" id="username" /><br /> -->
<!-- 	<label for="email">Email</label> -->
<!-- 	<input type="email" name="email" id="email" /><br /> -->
<!-- 	<label for="password">Password</label> -->
<!-- 	<input type="password" name="password" id="password" /><br /> -->
<!-- 	<button>Continue</button> -->
<!-- </form> -->

<SignupForm data={data.form} />
