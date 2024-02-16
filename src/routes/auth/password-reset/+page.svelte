<script lang="ts">
	import { enhance } from '$app/forms';
</script>

<h1>Password Reset</h1>
<form method="post" use:enhance>
	<label for="email">Email</label>
	<input type="email" name="email" id="email" /><br />
	<button>Continue</button>
</form>
