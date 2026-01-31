<script lang="ts">
  import { onMount } from 'svelte';
  import AddThreadModal from './lib/AddThreadModal.svelte';
  import CreateSeriesModal from './lib/CreateSeriesModal.svelte';
  import Header from './lib/Header.svelte';
  import Login from './lib/Login.svelte';
  import { router } from './lib/router';
  import SeriesCard from './lib/SeriesCard.svelte';
  import SeriesDetail from './lib/SeriesDetail.svelte';
  import { series } from './lib/seriesStore';
  import Sidebar from './lib/Sidebar.svelte';
  import { currentFilter, currentSort, filteredThreads, threads } from './lib/store';
  import { supabase } from './lib/supabase';
  import ThreadCard from './lib/ThreadCard.svelte';
  import ThreadReader from './lib/ThreadReader.svelte';

  let session: any = null;
  let loadingSession = true;

  async function initStore() {
    try {
      if (typeof threads.init === 'function') {
        await threads.init();
      }
      if (typeof series.init === 'function') {
        await series.init();
      }
    } catch (e) {
      console.error('Failed to init threads store:', e);
    }
  }

  onMount(() => {
    // Initialize Router
    if (typeof router.init === 'function') {
      router.init();
    }
    
    // Check if we have a potential auth redirect
    const hash = window.location.hash;
    
    // Reliance on onAuthStateChange for all session handling to avoid getSession promise hangs
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, _session) => {
      console.log('Auth state change:', _event, _session?.user?.email);
      const previousSession = session;
      session = _session;
      
      if (session && !previousSession) {
        // Only init if we are logging in (not just token refresh)
        initStore();
      }

      if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION') {
         // Clear hash after successful login to clean up URL, ONLY if it has auth params
         // But we need to preserve our app routing if present
         if (window.location.hash && window.location.hash.includes('access_token')) {
            window.location.hash = '/';
         }
      }
      
      // Stop loading once we get the initial session event
      loadingSession = false;
    });

    // Explicitly check session to ensure we don't miss it
    supabase.auth.getSession().then(({ data: { session: _session } }) => {
      if (_session && !session) {
        console.log('Restored session via getSession');
        session = _session;
        initStore();
        loadingSession = false;
      }
    });

    return () => subscription.unsubscribe();
  });

  let showAddModal = false;
  let showCreateSeriesModal = false;

  function openAddModal() {
    showAddModal = true;
  }

  function closeAddModal() {
    showAddModal = false;
  }

  function openCreateSeriesModal() {
    showCreateSeriesModal = true;
  }

  function closeCreateSeriesModal() {
    showCreateSeriesModal = false;
  }

  function getFilterTitle(filter: string): string {
    switch (filter) {
      case 'all': return 'All Threads';
      case 'unread': return 'Unread Threads';
      case 'favorites': return 'Favorite Threads';
      case 'archived': return 'Archived Threads';
      case 'series': return 'Series';
      default: return 'Threads';
    }
  }
</script>

{#if loadingSession}
  <div class="loading-screen">
    <div class="spinner"></div>
  </div>
{:else if !session && !$router.path.startsWith('/thread') && !$router.path.startsWith('/series')}
  <Login />
{:else}
  <div class="app">
    {#if $router.path === '/' || $router.path === ''}
      <Header />
      
      <main class="main-layout">
        <Sidebar />
        
        <section class="content-section">
          <div class="section-header">
            <h2>{getFilterTitle($currentFilter)}</h2>
            <div class="controls-group">
              {#if $currentFilter === 'series'}
                <button class="btn btn-primary btn-sm" on:click={openCreateSeriesModal}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  New Series
                </button>
              {:else}
                <button class="btn btn-primary btn-sm" on:click={openAddModal}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Thread
                </button>
              {/if}
              <div class="sort-controls">
                <label for="sort-select" class="sort-label">Sort by:</label>
                <select id="sort-select" class="sort-select" bind:value={$currentSort}>
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="author">By Author</option>
                  <option value="length">By Length</option>
                </select>
              </div>
            </div>
          </div>

          {#if $currentFilter === 'series'}
            {#if $series.length === 0}
               <div class="empty-state">
                  <div class="empty-icon">🗂️</div>
                  <h3>No series found</h3>
                  <p>Create your first series to organize your threads</p>
                   <button class="btn btn-primary" on:click={openCreateSeriesModal}>
                      Create New Series
                   </button>
               </div>
            {:else}
               <div class="thread-grid">
                  {#each $series as s (s.id)}
                    <SeriesCard series={s} />
                  {/each}
               </div>
            {/if}
          {:else}
            {#if $filteredThreads.length === 0}
              <div class="empty-state">
                <div class="empty-icon">🧵</div>
                <h3>No threads found</h3>
                <p>
                  {#if $currentFilter === 'all'}
                    Start building your thread library by adding your first thread
                  {:else}
                    No threads match your current filter
                  {/if}
                </p>
                {#if $currentFilter === 'all'}
                  <button class="btn btn-primary" on:click={openAddModal}>
                    Add Your First Thread
                  </button>
                {/if}
              </div>
            {:else}
              <div class="thread-grid">
                {#each $filteredThreads as thread (thread.id)}
                  <ThreadCard {thread} />
                {/each}
              </div>
            {/if}
          {/if}
        </section>
      </main>
    {:else if $router.path === '/thread'}
      <ThreadReader id={$router.params.id} />
    {:else if $router.path === '/series'}
      <SeriesDetail id={$router.params.id} />
    {/if}

    <AddThreadModal isOpen={showAddModal} onClose={closeAddModal} />
    <CreateSeriesModal isOpen={showCreateSeriesModal} onClose={closeCreateSeriesModal} />
  </div>
{/if}

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .main-layout {
    display: flex;
    flex: 1;
  }

  .content-section {
    flex: 1;
    padding: var(--space-xl);
    overflow-y: auto;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-xl);
    flex-wrap: wrap;
    gap: var(--space-md);
  }

  .section-header h2 {
    font-size: 2rem;
    font-weight: 800;
    color: var(--color-text-primary);
    letter-spacing: -0.02em;
  }

  .sort-controls {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .sort-label {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  .sort-select {
    width: auto;
    padding: var(--space-xs) var(--space-md);
    font-size: 0.9rem;
    cursor: pointer;
  }

  .controls-group {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .btn-sm {
    padding: var(--space-xs) var(--space-sm);
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .thread-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: var(--space-lg);
    animation: fadeIn var(--transition-base) ease-out;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-2xl);
    text-align: center;
    min-height: 400px;
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: var(--space-lg);
    opacity: 0.5;
  }

  .empty-state h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: var(--space-sm);
  }

  .empty-state p {
    font-size: 1rem;
    color: var(--color-text-secondary);
    margin-bottom: var(--space-xl);
    max-width: 400px;
  }

  /* Loading Spinner */
  .loading-screen {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg);
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(99, 102, 241, 0.3);
    border-radius: 50%;
    border-top-color: var(--color-primary);
    animation: spin 1s ease-in-out infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 1024px) {
    .thread-grid {
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
  }

  @media (max-width: 768px) {
    .content-section {
      padding: var(--space-lg);
    }

    .section-header h2 {
      font-size: 1.5rem;
    }

    .thread-grid {
      grid-template-columns: 1fr;
      gap: var(--space-md);
    }

    .sort-label {
      display: none;
    }
  }
</style>
