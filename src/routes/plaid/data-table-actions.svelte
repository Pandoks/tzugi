<script lang="ts">
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { getContext } from 'svelte';

	export let transactionId: string;
	const authorizedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
	let file: FileList;
	const receiptStatus = getContext('showReceipt');

	const handleUpload = async () => {
		if (file && file.length > 0) {
			const formData = new FormData();
			formData.append('transactionId', transactionId);
			formData.append('fileUpload', file[file.length - 1]);

			try {
				const response = await fetch('/api/receipt/set', {
					method: 'POST',
					body: formData
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.message || 'Upload failed');
				}

				const result = await response.json();
				console.log(result);
			} catch (err) {
				console.log(err);
			}
		}
	};
</script>

<DropdownMenu.Root closeOnItemClick={false}>
	<DropdownMenu.Trigger asChild let:builder>
		<Button variant="ghost" builders={[builder]} size="icon" class="relative h-8 w-8 p-0">
			<span class="sr-only">Open menu</span>
			<Ellipsis class="h-4 w-4" />
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Item>
			<div class="group">
				<label for="file">Upload your file</label>
				<input
					type="file"
					id="file"
					name="fileUpload"
					accept={authorizedExtensions.join(',')}
					bind:files={file}
					required
				/>
			</div>
			<button type="submit" on:click={handleUpload}>Submit</button>
		</DropdownMenu.Item>
		<DropdownMenu.Item on:click={() => navigator.clipboard.writeText(transactionId)}>
			View Image
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
