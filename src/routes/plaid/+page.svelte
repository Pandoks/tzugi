<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { onMount, setContext } from 'svelte';
	import type { Transaction } from 'plaid';
	import DataTable from './data-table.svelte';

	let Plaid: any;
	let plaid_login: any;
	let transactions: Transaction[] = [];
	export let data;

	onMount(async () => {
		Plaid = window.Plaid;
		plaid_login = await createLogin();
	});

	const getTransactions = async () => {
		const res = await fetch('/api/plaid/transactions');
		const data = await res.json();
		transactions = data.transactions;
	};

	const getLinkToken = async () => {
		const response = await fetch('/api/plaid/link-token');
		const data = await response.json();
		return data.link_token;
	};

	const exchangePublicToken = async (public_token: string, metadata: any) => {
		await fetch('/api/plaid/access-token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ public_token: public_token, metadata: metadata })
		});
	};

	const createLogin = async () => {
		const token = await getLinkToken();
		const config = { token: token, onSuccess: exchangePublicToken };
		return Plaid!.create(config);
	};
</script>

<svelte:head>
	<script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
</svelte:head>

<Button on:click={plaid_login.open()}>Link Plaid Account</Button>
<Button on:click={getTransactions}>Get Transactions</Button>
<div class="container mx-auto py-10">
	<DataTable {transactions} supabase={data.supabase} />
</div>
