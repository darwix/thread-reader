<script lang="ts">
  import { fade } from 'svelte/transition';
  import { series } from './seriesStore';
  import { threads } from './store';
  import ThreadCard from './ThreadCard.svelte';
  
  export let id: string;

  // Reactive derived values
  $: currentSeries = $series.find(s => s.id === id);
  
  $: seriesThreads = currentSeries 
    ? $threads.filter(t => currentSeries.threadIds.includes(t.id))
      // Maintain order if possible, or just filter. 
      // Ideally we sort by the order in threadIds, but that might need more logic
      .sort((a, b) => {
         const indexA = currentSeries.threadIds.indexOf(a.id);
         const indexB = currentSeries.threadIds.indexOf(b.id);
         return indexA - indexB;
      })
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
            <span class="badge">Series</span>
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
</div>

<style>
  .series-detail {
    padding: var(--space-xl);
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
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
