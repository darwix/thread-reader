<script lang="ts">
  import { series } from './seriesStore';
  import { threads } from './store';

  export let isOpen: boolean;
  export let onClose: () => void;

  let title = '';
  let description = '';
  let coverImage = '';
  let selectedThreadIds: Set<string> = new Set();
  
  let isSaving = false;
  let saveError = '';
  let searchTerm = '';

  $: filteredThreads = $threads.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function toggleThread(id: string) {
    if (selectedThreadIds.has(id)) {
      selectedThreadIds.delete(id);
      selectedThreadIds = new Set(selectedThreadIds);
    } else {
      selectedThreadIds.add(id);
      selectedThreadIds = new Set(selectedThreadIds);
    }
  }

  async function handleSubmit() {
    if (!title) return;

    isSaving = true;
    saveError = '';

    try {
      await series.addSeries({
        title,
        description,
        coverImage,
        threadIds: Array.from(selectedThreadIds)
      });

      // Reset
      title = '';
      description = '';
      coverImage = '';
      selectedThreadIds = new Set();
      onClose();
    } catch (e: any) {
      console.error('Failed to create series:', e);
      saveError = e.message || 'Failed to create series';
    } finally {
      isSaving = false;
    }
  }

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget && !isSaving) {
      onClose();
    }
  }
</script>

{#if isOpen}
  <div class="modal" on:click={handleOverlayClick} role="button" tabindex="0" on:keydown={(e) => e.key === 'Escape' && onClose()}>
    <div class="modal-overlay"></div>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Create New Series</h2>
        <button class="icon-btn" on:click={onClose} disabled={isSaving}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6L18 18" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      {#if saveError}
        <div class="error-message">
          {saveError}
        </div>
      {/if}

      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
          <label for="series-title">Series Title *</label>
          <input 
            type="text" 
            id="series-title" 
            bind:value={title} 
            placeholder="e.g. My Vue.js Learning Journey" 
            required 
            disabled={isSaving}
          />
        </div>

        <div class="form-group">
          <label for="series-desc">Description</label>
          <textarea 
            id="series-desc" 
            bind:value={description} 
            placeholder="What is this collection about?"
            rows="3"
            disabled={isSaving}
          ></textarea>
        </div>

        <div class="form-group">
          <label for="series-cover">Cover Image URL (Optional)</label>
          <input 
            type="url" 
            id="series-cover" 
            bind:value={coverImage} 
            placeholder="https://..." 
            disabled={isSaving}
          />
        </div>

        <div class="form-group">
            <label for="thread-select">Select Threads ({selectedThreadIds.size})</label>
            <input 
                type="text" 
                bind:value={searchTerm}
                placeholder="Search your threads..."
                class="search-input"
            />
            <div class="thread-list">
                {#each filteredThreads as thread (thread.id)}
                    <button 
                        type="button" 
                        class="thread-item" 
                        class:selected={selectedThreadIds.has(thread.id)}
                        on:click={() => toggleThread(thread.id)}
                    >
                        <div class="checkbox">
                            {#if selectedThreadIds.has(thread.id)}
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            {/if}
                        </div>
                        <div class="thread-info">
                            <div class="thread-title">{thread.title || thread.tweets[0]?.content.slice(0, 50)}</div>
                            <div class="thread-author">{thread.author}</div>
                        </div>
                    </button>
                {/each}
                {#if filteredThreads.length === 0}
                    <div class="empty-list">No threads found matching search.</div>
                {/if}
            </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" on:click={onClose} disabled={isSaving}>Cancel</button>
          <button type="submit" class="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Creating...' : 'Create Series'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .modal {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-lg);
  }

  .modal-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
  }

  .modal-content {
    position: relative;
    width: 100%;
    max-width: 600px;
    background: #0F172A; /* Fallback */
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: var(--space-xl);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-lg);
  }

  .modal-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
  }

  .form-group {
    margin-bottom: var(--space-md);
  }

  label {
    display: block;
    margin-bottom: var(--space-xs);
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  input[type="text"], input[type="url"], textarea {
    width: 100%;
    padding: var(--space-sm);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  .search-input {
      margin-bottom: var(--space-xs);
  }

  .thread-list {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-bg-primary);
  }

  .thread-item {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      width: 100%;
      padding: var(--space-sm);
      border: none;
      background: none;
      text-align: left;
      cursor: pointer;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text-secondary);
  }

  .thread-item:last-child {
      border-bottom: none;
  }

  .thread-item:hover {
      background: var(--color-bg-tertiary);
  }

  .thread-item.selected {
      background: rgba(99, 102, 241, 0.1);
      color: var(--color-text-primary);
  }

  .checkbox {
      width: 18px;
      height: 18px;
      border: 2px solid var(--color-border);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary);
  }

  .thread-item.selected .checkbox {
      border-color: var(--color-primary);
      background: rgba(99, 102, 241, 0.1);
  }

  .thread-info {
      flex: 1;
      overflow: hidden;
  }

  .thread-title {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
  }

  .thread-author {
      font-size: 0.8rem;
      opacity: 0.7;
  }

  .empty-list {
      padding: var(--space-md);
      text-align: center;
      color: var(--color-text-tertiary);
      font-size: 0.9rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-md);
    margin-top: var(--space-lg);
  }

  .error-message {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
      padding: var(--space-sm);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-md);
  }
</style>
