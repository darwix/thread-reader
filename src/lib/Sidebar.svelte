<script lang="ts">
  import { series } from './seriesStore';
  import { allTags, counts, currentFilter, searchQuery, selectedTag, type FilterType } from './store';

  let searchValue = '';
  
  $: searchQuery.set(searchValue);

  function setFilter(filter: FilterType) {
    currentFilter.set(filter);
    selectedTag.set(null);
  }

  function selectTag(tag: string) {
    if ($selectedTag === tag) {
      selectedTag.set(null);
    } else {
      selectedTag.set(tag);
      currentFilter.set('all');
    }
  }
</script>

<aside class="sidebar">
  <div class="search-box">
    <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
      <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
    <input 
      type="text" 
      bind:value={searchValue}
      placeholder="Search threads..."
      class="search-input"
    />
  </div>

  <div class="filter-section">
    <h3>Collections</h3>
    <div class="filter-list">
      <button 
        class="filter-item" 
        class:active={$currentFilter === 'all' && !$selectedTag}
        on:click={() => setFilter('all')}
      >
        <span class="filter-icon">📚</span>
        <span>All Threads</span>
        <span class="count">{$counts.all}</span>
      </button>
      <button 
        class="filter-item" 
        class:active={$currentFilter === 'unread'}
        on:click={() => setFilter('unread')}
      >
        <span class="filter-icon">📖</span>
        <span>Unread</span>
        <span class="count">{$counts.unread}</span>
      </button>
      <button 
        class="filter-item" 
        class:active={$currentFilter === 'favorites'}
        on:click={() => setFilter('favorites')}
      >
        <span class="filter-icon">⭐</span>
        <span>Favorites</span>
        <span class="count">{$counts.favorites}</span>
      </button>
      <button 
        class="filter-item" 
        class:active={$currentFilter === 'series'}
        on:click={() => setFilter('series')}
      >
        <span class="filter-icon">🗂️</span>
        <span>Series</span>
        <span class="count">{$series.length}</span>
      </button>
      <button 
        class="filter-item" 
        class:active={$currentFilter === 'archived'}
        on:click={() => setFilter('archived')}
      >
        <span class="filter-icon">📦</span>
        <span>Archived</span>
        <span class="count">{$counts.archived}</span>
      </button>
    </div>
  </div>

  {#if $allTags.length > 0}
    <div class="tags-section">
      <h3>Tags</h3>
      <div class="tags-list">
        {#each $allTags as tag}
          <button 
            class="tag" 
            class:active={$selectedTag === tag}
            on:click={() => selectTag(tag)}
          >
            #{tag}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</aside>

<style>
  .sidebar {
    width: 280px;
    background: var(--color-bg-secondary);
    border-right: 1px solid var(--color-border);
    padding: var(--space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
    overflow-y: auto;
    height: calc(100vh - 73px);
    position: sticky;
    top: 73px;
  }

  .search-box {
    position: relative;
  }

  .search-icon {
    position: absolute;
    left: var(--space-md);
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-tertiary);
    pointer-events: none;
  }

  .search-input {
    padding-left: 2.75rem;
  }

  .filter-section h3,
  .tags-section h3 {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-tertiary);
    font-weight: 600;
    margin-bottom: var(--space-md);
  }

  .filter-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .filter-item {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: left;
  }

  .filter-item:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  .filter-item.active {
    background: var(--color-bg-tertiary);
    color: var(--color-primary);
  }

  .filter-icon {
    font-size: 1.1rem;
  }

  .count {
    margin-left: auto;
    font-size: 0.8rem;
    color: var(--color-text-tertiary);
    background: var(--color-bg-tertiary);
    padding: 0.125rem 0.5rem;
    border-radius: 999px;
  }

  .filter-item.active .count {
    background: var(--color-primary);
    color: white;
  }

  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .tag {
    cursor: pointer;
  }

  .tag.active {
    background: var(--gradient-primary);
    color: white;
    border-color: transparent;
  }

  @media (max-width: 1024px) {
    .sidebar {
      width: 240px;
      padding: var(--space-lg);
    }
  }

  @media (max-width: 768px) {
    .sidebar {
      display: none;
    }
  }
</style>
