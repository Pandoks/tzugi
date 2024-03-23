<script lang="ts">
	import type { Transaction } from 'plaid';
	import { writable } from 'svelte/store';
	import { createRender, createTable, Render, Subscribe } from 'svelte-headless-table';
	import * as Table from '$lib/components/ui/table';
	import DataTableActions from './data-table-actions.svelte';
	import { addPagination } from 'svelte-headless-table/plugins';
	import { Button } from '$lib/components/ui/button';

	export let transactions: Transaction[] = [];
	const transactionsStore = writable(transactions);
	$: $transactionsStore = transactions; // when transactions changes, update the store

	const table = createTable(transactionsStore, {
		page: addPagination({
			initialPageIndex: 0,
			initialPageSize: 10
		})
	});

	const columns = table.createColumns([
		table.column({
			accessor: 'date',
			header: 'Date'
		}),
		table.column({
			accessor: 'name',
			header: 'Name'
		}),
		table.column({
			accessor: 'amount',
			header: 'Amount'
		}),
		table.column({
			accessor: ({ transaction_id }) => transaction_id,
			header: '',
			cell: ({ value }) => {
				return createRender(DataTableActions, { id: value });
			}
		})
	]);

	const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates } =
		table.createViewModel(columns);

	const { pageIndex, pageCount, pageSize, hasNextPage, hasPreviousPage } = pluginStates.page;
</script>

<div>
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
	<div class="flex items-center justify-end space-x-4 py-4">
		<Button variant="outline" size="sm" on:click={() => $pageIndex--} disabled={!$hasPreviousPage}
			>Previous</Button
		>
		<div>
			{#if $pageIndex > 0 && $pageIndex < $pageCount - 1}
				{$pageIndex + 1}
			{:else if $pageIndex === 0}
				{test}
			{:else}
				{$pageIndex + 1}
			{/if}
		</div>
		<Button variant="outline" size="sm" disabled={!$hasNextPage} on:click={() => $pageIndex++}
			>Next</Button
		>
	</div>
</div>
