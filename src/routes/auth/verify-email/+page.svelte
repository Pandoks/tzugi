<script lang="ts">
	import { enhance } from '$app/forms';
</script>

<h1>Verification Code</h1>
<form method="post" use:enhance>
	<label for="verification-code">Verification Code</label>
	<input type="text" name="verification-code" id="verification-code" /><br />
	<button>Verify</button>
</form>
