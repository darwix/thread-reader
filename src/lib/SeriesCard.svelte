<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { Series } from './seriesStore';
  import { threads } from './store';

  export let series: Series;

  // Derive thread count
  $: threadCount = series.threadIds ? series.threadIds.length : 0;
  
  // Get thread objects to show cover image if series doesn't have one
  $: seriesThreads = $threads.filter(t => series.threadIds.includes(t.id));
  
  // determine cover image
  $: coverImage = series.coverImage || (seriesThreads.length > 0 && seriesThreads[0].tweets.find(t => t.mediaUrls?.length)?.mediaUrls?.[0]) || null;
  
  const formattedDate = new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric' 
  }).format(series.createdAt);
</script>

<a href="#/series/{series.id}" class="series-card-link">
  <article class="series-card">
    {#if coverImage}
      <div class="card-cover" transition:fade>
        <img src={coverImage} alt="Series Cover" />
        <div class="cover-overlay"></div>
      </div>
    {/if}

    <div class="card-content">
      <div class="card-header">
        <div class="header-left">
          <div class="series-badge">Series</div>
          {#if series.isPublic}
            <span class="public-badge" title="Publicly Shared">🌐</span>
          {/if}
        </div>
        <span class="date">{formattedDate}</span>
      </div>

      <h3 class="title">{series.title}</h3>
      <p class="description">{series.description || 'No description provided.'}</p>

      <div class="card-footer">
        <div class="stats">
          <span class="stat-item">
            <span class="icon">🧵</span>
            {threadCount} Threads
          </span>
        </div>
      </div>
    </div>
  </article>
</a>

<style>
  .series-card-link {
    text-decoration: none;
    color: inherit;
    display: block;
    height: 100%;
  }

  .series-card {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    cursor: pointer;
    transition: all var(--transition-fast);
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 200px;
  }

  .series-card:hover {
    transform: translateY(-2px);
    border-color: var(--color-primary);
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
  }

  .card-cover {
    height: 140px;
    position: relative;
    overflow: hidden;
  }

  .card-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  .series-card:hover .card-cover img {
    transform: scale(1.05);
  }

  .cover-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(15, 23, 42, 0.8), transparent);
  }

  .card-content {
    padding: var(--space-lg);
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-sm);
  }

  .header-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
  }

  .series-badge {
      background: var(--color-primary);
      color: white;
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 999px;
      font-weight: 600;
      text-transform: uppercase;
  }

  .public-badge {
      font-size: 0.9rem;
  }

  .date {
    font-size: 0.8rem;
    color: var(--color-text-tertiary);
  }

  .title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: var(--space-xs);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .description {
      font-size: 0.9rem;
      color: var(--color-text-secondary);
      margin-bottom: var(--space-lg);
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex: 1;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: var(--space-md);
    border-top: 1px solid var(--color-border);
  }

  .stats {
    display: flex;
    gap: var(--space-md);
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.85rem;
    color: var(--color-text-tertiary);
  }

  .icon {
    font-size: 1rem;
  }
</style>
