<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { router } from './router';
  import { series, type Series } from './seriesStore';
  import { threads, type Thread } from './store';
  import { supabase } from './supabase';
  import ThreadCard from './ThreadCard.svelte';
  
  export let id: string;
  
  let showDeleteModal = false;
  let userId: string | null = null;
  let publicSeries: Series | null = null;
  let publicThreads: Thread[] = [];

  onMount(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id || null;

      if (!$series.find(s => s.id === id)) {
          const s = await series.fetchPublicSeries(id);
          if (s) {
              publicSeries = s;
              // Fetch threads for this public series
              const threadPromises = s.threadIds.map(tid => threads.fetchPublicThread(tid));
              const results = await Promise.all(threadPromises);
              publicThreads = results.filter((t): t is Thread => t !== null);
          }
      }
  });

  async function handleDelete() {
      if (currentSeries) {
          await series.deleteSeries(id);
          showDeleteModal = false;
          router.navigate('/');
      }
  }

  async function togglePublic() {
      if (currentSeries && isOwner) {
          const newVal = !currentSeries.isPublic;
          await series.updateSeries(currentSeries.id, { isPublic: newVal });
      }
  }

  function copyPublicLink() {
      if (currentSeries) {
          const url = `${window.location.origin}/#/series/${currentSeries.id}`;
          navigator.clipboard.writeText(url);
          const btn = document.getElementById('copy-series-link');
          if (btn) {
              const original = btn.innerHTML;
              btn.innerHTML = 'Copied!';
              setTimeout(() => btn.innerHTML = original, 2000);
          }
      }
  }

  // Reactive derived values
  $: currentSeries = $series.find(s => s.id === id) || publicSeries;
  $: isOwner = userId && currentSeries && currentSeries.user_id === userId;
  
  $: seriesThreads = currentSeries 
    ? (isOwner ? $threads : [...$threads, ...publicThreads])
      .filter(t => currentSeries!.threadIds.includes(t.id))
      .sort((a, b) => {
         const indexA = currentSeries!.threadIds.indexOf(a.id);
         const indexB = currentSeries!.threadIds.indexOf(b.id);
         return indexA - indexB;
      })
      // Unique threads only
      .filter((t, i, arr) => arr.findIndex(tt => tt.id === t.id) === i)
    : [];

  const formattedDate = (dateString: string | Date | undefined) => {
      if (!dateString) return '';
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric',
        month: 'long', 
        day: 'numeric' 
      }).format(new Date(dateString));
  };
</script>

<div class="series-detail" in:fade>
  {#if currentSeries}
    <header class="detail-header">
      <a href="#/" class="back-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Library
      </a>
      
      <div class="series-info">
        {#if currentSeries.coverImage}
            <div class="series-cover">
                <img src={currentSeries.coverImage} alt={currentSeries.title} />
                <div class="overlay"></div>
            </div>
        {/if}
        
        <div class="info-content">
            <div class="info-header">
                <span class="badge">Series</span>
                {#if isOwner}
                    <div class="header-actions">
                        <button class="action-btn" on:click={togglePublic} title={currentSeries.isPublic ? "Make Private" : "Make Public"}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill={currentSeries.isPublic ? "currentColor" : "none"} stroke="currentColor" stroke-width="2" class={currentSeries.isPublic ? 'active' : ''}>
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 2a10 10 0 0 1 0 20M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/>
                            </svg>
                        </button>

                        {#if currentSeries.isPublic}
                            <button id="copy-series-link" class="action-btn" on:click={copyPublicLink} title="Copy Public Link">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                </svg>
                            </button>
                        {/if}

                        <button class="delete-btn" on:click={() => showDeleteModal = true} title="Delete Series">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                            </svg>
                        </button>
                    </div>
                {/if}
            </div>
            <h1>{currentSeries.title}</h1>
            <p class="meta">Created on {formattedDate(currentSeries.createdAt)} • {seriesThreads.length} Threads</p>
            {#if currentSeries.description}
                <p class="description">{currentSeries.description}</p>
            {/if}
        </div>
      </div>
    </header>

    <div class="threads-list">
        <h2>Threads in this Series</h2>
        <div class="grid">
            {#each seriesThreads as thread (thread.id)}
                <ThreadCard {thread} />
            {/each}
        </div>
        {#if seriesThreads.length === 0}
            <div class="empty-threads">
                <p>This series has no threads yet.</p>
            </div>
        {/if}
    </div>

  {:else}
    <div class="not-found">
      <h2>Series not found</h2>
      <a href="#/" class="btn btn-primary">Go Home</a>
    </div>
  {/if}

  <!-- Delete Confirmation Modal -->
  {#if showDeleteModal}
    <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-overlay" on:click={() => showDeleteModal = false} role="button" tabindex="0" on:keydown={(e) => e.key === 'Escape' && (showDeleteModal = false)} aria-label="Close modal"></div>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <div class="modal-content delete-modal" on:click|stopPropagation role="document">
            <h3>Delete Series?</h3>
            <p>Are you sure you want to delete this series? The threads within it will NOT be deleted from your library.</p>
            <div class="modal-actions">
                <button class="btn-secondary" on:click={() => showDeleteModal = false}>Cancel</button>
                <button class="btn-danger" on:click={handleDelete}>Delete Series</button>
            </div>
        </div>
    </div>
  {/if}
</div>

<style>
  .series-detail {
    padding: var(--space-xl);
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  /* Modal Styles */
  .modal {
      position: fixed;
      inset: 0;
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
  }

  .modal-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(2px);
      z-index: 0;
  }

  .modal-content {
      position: relative;
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 2rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      z-index: 10;
  }

  .delete-modal h3 {
      margin-top: 0;
      color: #f8fafc;
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
  }

  .delete-modal p {
      color: #94a3b8;
      margin-bottom: 2rem;
      line-height: 1.5;
  }

  .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
  }

  .btn-secondary {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.2);
      color: #cbd5e1;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
  }

  .btn-secondary:hover {
      background: rgba(255,255,255,0.05);
      color: #fff;
  }

  .btn-danger {
      background: #ef4444;
      border: none;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
  }

  .btn-danger:hover {
      background: #dc2626;
  }

  .info-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
  }

  .delete-btn {
      color: #94a3b8;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.1);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 8px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
  }

  .delete-btn:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.2);
  }

  .header-actions {
      display: flex;
      gap: 0.5rem;
  }

  .action-btn {
      color: #94a3b8;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.1);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 8px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
  }

  .action-btn:hover {
      color: var(--color-primary);
      background: rgba(99, 102, 241, 0.1);
      border-color: rgba(99, 102, 241, 0.2);
  }

  .action-btn svg.active {
      color: var(--color-primary);
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: 0.9rem;
    margin-bottom: var(--space-xl);
    transition: color 0.2s;
  }

  .back-link:hover {
    color: var(--color-primary);
  }

  .detail-header {
    margin-bottom: var(--space-2xl);
  }

  .series-info {
      position: relative;
      border-radius: var(--radius-xl);
      overflow: hidden;
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
  }

  .series-cover {
      height: 200px;
      position: relative;
  }

  .series-cover img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
  }

  .overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, var(--color-bg-secondary), transparent);
  }

  .info-content {
      padding: var(--space-xl);
      position: relative;
  }

  .series-cover + .info-content {
      margin-top: -60px;
      padding-top: 0;
  }

  .badge {
      background: var(--color-primary);
      color: white;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      display: inline-block;
      margin-bottom: var(--space-md);
  }

  h1 {
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--color-text-primary);
      margin-bottom: var(--space-sm);
      line-height: 1.2;
  }

  .meta {
      color: var(--color-text-tertiary);
      margin-bottom: var(--space-lg);
  }

  .description {
      color: var(--color-text-secondary);
      font-size: 1.1rem;
      line-height: 1.6;
      max-width: 800px;
  }

  .threads-list h2 {
      font-size: 1.5rem;
      margin-bottom: var(--space-xl);
      color: var(--color-text-primary);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: var(--space-lg);
  }

  .empty-threads {
      text-align: center;
      padding: var(--space-2xl);
      color: var(--color-text-secondary);
      background: var(--color-bg-secondary);
      border-radius: var(--radius-lg);
      border: 1px dashed var(--color-border);
  }

  .not-found {
      text-align: center;
      padding: var(--space-2xl);
  }

  @media (max-width: 768px) {
      .series-detail {
          padding: var(--space-lg);
      }
      
      h1 {
          font-size: 2rem;
      }

      .grid {
          grid-template-columns: 1fr;
      }
  }
</style>
