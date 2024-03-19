<script lang="ts">
	import { createTable, Render, Subscribe } from 'svelte-headless-table';
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import { readable } from 'svelte/store';
	import type { Transaction } from 'plaid';
	import * as Table from '$lib/components/ui/table';

	let Plaid: any;
	let plaid_login: any;
	let transactions: Transaction[] = [];

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

	let transactionsTable = createTable(readable(transactions));
	const transactionsTableColumns = transactionsTable.createColumns([
		transactionsTable.column({
			accessor: 'transaction_id',
			header: 'ID'
		}),
		transactionsTable.column({
			accessor: 'amount',
			header: 'Amount'
		}),
		transactionsTable.column({
			accessor: 'name',
			header: 'Transaction Name'
		}),
		transactionsTable.column({
			accessor: 'authorized_date',
			header: 'Date'
		}),
		transactionsTable.column({
			accessor: ({ transaction_id }) => transaction_id,
			header: ''
		})
	]);
	const { headerRows, pageRows, tableAttrs, tableBodyAttrs } =
		transactionsTable.createViewModel(transactionsTableColumns);
</script>

<svelte:head>
	<script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
</svelte:head>

<Button on:click={plaid_login.open()}>Link Plaid Account</Button>
<Button on:click={getTransactions}>Get Transactions</Button>
{#if transactions.length > 0}
	test
	<div class="rounded-md border">
		<Table.Root {...$tableAttrs}>
			<Table.Header>
				{#each $headerRows as headerRow}
					<Subscribe rowAttrs={headerRow.attrs()}>
						<Table.Row>
							{#each headerRow.cells as cell (cell.id)}
								<Subscribe attrs={cell.attrs()} let:attrs props={cell.props()}>
									<Table.Head {...attrs}>
										<Render of={cell.render()} />
									</Table.Head>
								</Subscribe>
							{/each}
						</Table.Row>
					</Subscribe>
				{/each}
			</Table.Header>
			<Table.Body {...$tableBodyAttrs}>
				{#each $pageRows as row (row.id)}
					<Subscribe rowAttrs={row.attrs()} let:rowAttrs>
						<Table.Row {...rowAttrs}>
							{#each row.cells as cell (cell.id)}
								<Subscribe attrs={cell.attrs()} let:attrs>
									<Table.Cell {...attrs}>
										<Render of={cell.render()} />
									</Table.Cell>
								</Subscribe>
							{/each}
						</Table.Row>
					</Subscribe>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
{/if}
