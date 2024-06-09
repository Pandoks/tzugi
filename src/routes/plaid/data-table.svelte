<script lang="ts">
  import type { Transaction } from 'plaid';
  import { writable } from 'svelte/store';
  import { createTable, Render, Subscribe } from 'svelte-headless-table';
  import * as Table from '$lib/components/ui/table';
  import { addPagination } from 'svelte-headless-table/plugins';
  import { Button } from '$lib/components/ui/button';
  import { paginationTextGenerator } from '$lib/utils';
  import { onDestroy, onMount } from 'svelte';
  import type { SupabaseClient } from '@supabase/supabase-js';
  import { AspectRatio } from '$lib/components/ui/aspect-ratio';

  export let transactions: Transaction[] = [];
  export let supabase: SupabaseClient;
  const transactionsStore = writable(transactions);
  $: $transactionsStore = transactions;
  let file: FileList;
  let imageURLs: string[] = [];
  let imageURL: string;
  let currentRowId: any;
  let currentImagePath = '';
  let currentSelectedTransaction: Transaction | null;
  const AUTHORIZED_FILE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
  let initialized = false;

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
    })
  ]);

  const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates } =
    table.createViewModel(columns);

  const { pageIndex, pageCount, hasNextPage, hasPreviousPage } = pluginStates.page;
  $: paginationButtonTextList = paginationTextGenerator({
    pageIndex: $pageIndex,
    pageCount: $pageCount
  });
  $: if (initialized) {
    currentSelectedTransaction =
      currentRowId && $pageRows ? $pageRows[currentRowId].original : null;
  }

  onMount(() => {
    initialized = true;
  });

  $: if (initialized) {
    fetch('/api/receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transactionId: currentSelectedTransaction ? currentSelectedTransaction.transaction_id : ''
      })
    })
      .then((response) => response.json().then((obj) => (currentImagePath = obj.imagePath)))
      .then(() =>
        supabase.storage
          .from('receipts')
          .download(currentImagePath.substring(currentImagePath.indexOf('/') + 1))
          .then((response) => {
            if (response.error) imageURL = '';
            if (response.data) {
              imageURL = URL.createObjectURL(response.data);
            }
          })
          .catch((err) => console.error('Download error:', err.message))
      );
  }

  $: if (initialized) {
    imageURLs.push(imageURL);
  }

  onDestroy(() => {
    for (let index = 0; index < imageURLs.length; index++) {
      URL.revokeObjectURL(imageURLs[index]);
    }
  });

  const handleUpload = async () => {
    if (file && file.length > 0) {
      const formData = new FormData();
      formData.append('transactionId', currentSelectedTransaction.transaction_id);
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
        return;
      } catch (err) {
        console.log(err);
      }
    }
  };

  const clickRow = (id: string) => {
    if (currentRowId) {
      currentRowId = null;
    } else {
      currentRowId = id;
    }
  };
</script>

<div>
  <div class="rounded-md border">
    <div class="flex flex-row">
      <div>
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
                <Table.Row {...rowAttrs} on:click={() => clickRow(row.id)}>
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
      <div class="w-[450px]">
        <div class="group">
          <label for="file">Upload your file</label>
          <input
            type="file"
            id="file"
            name="fileUpload"
            accept={AUTHORIZED_FILE_EXTENSIONS.join(',')}
            bind:files={file}
            required
          />
        </div>
        <button type="submit" on:click={handleUpload}>Submit</button>
        {#if currentSelectedTransaction}
          <div>
            <p>Date: {currentSelectedTransaction.date}</p>
            <p>Name: {currentSelectedTransaction.name}</p>
            <p>Amount: {currentSelectedTransaction.amount}</p>
          </div>
        {/if}

        <AspectRatio ratio={16 / 9} class="bg-muted">
          <img
            src={imageURL}
            alt="Image of receipt of selected transaction"
            class="rounded-md object-cover"
          />
        </AspectRatio>
      </div>
    </div>
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
