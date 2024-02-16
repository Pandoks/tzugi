<script lang="ts">
	import { enhance } from '$app/forms';
</script>

<h1>New Password</h1>
<form method="post" use:enhance>
	<label for="new-password">Password</label>
	<input type="new-password" name="new-password" id="new-password" /><br />
	<button>Continue</button>
</form>
