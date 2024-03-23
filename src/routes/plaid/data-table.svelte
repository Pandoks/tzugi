<script lang="ts">
	import type { Transaction } from 'plaid';
	import { writable } from 'svelte/store';
	import { createRender, createTable, Render, Subscribe } from 'svelte-headless-table';
	import * as Table from '$lib/components/ui/table';
	import DataTableActions from './data-table-actions.svelte';
	import { addPagination } from 'svelte-headless-table/plugins';
	import { Button } from '$lib/components/ui/button';
	import { paginationTextGenerator } from '$lib/utils';

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

	const { pageIndex, pageCount, hasNextPage, hasPreviousPage } = pluginStates.page;
	$: paginationButtonTextList = paginationTextGenerator({
		pageIndex: $pageIndex,
		pageCount: $pageCount
	});
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
			{#each paginationButtonTextList as paginationButtonText}
				<Button
					class="pagination-button bg-transparent text-sm p-2 min-w-14 text-center whitespace-nowrap disabled:opacity-50"
					variant="ghost"
					size="sm"
					disabled={paginationButtonText === 'current' || paginationButtonText === '...'}
					on:click={() => ($pageIndex = parseInt(paginationButtonText) - 1)}
				>
					{#if paginationButtonText === 'current'}
						{$pageIndex + 1}
					{:else}
						{paginationButtonText}
					{/if}
				</Button>
			{/each}
		</div>
		<Button variant="outline" size="sm" disabled={!$hasNextPage} on:click={() => $pageIndex++}
			>Next</Button
		>
	</div>
</div>
