<script lang="ts">
  import type { Thread } from './store';
  import './ThreadCard.css';
  
  export let thread: Thread;
  
  function getTweetCount(thread: Thread): string {
    const count = thread.tweets.length;
    return `${count} tweet${count !== 1 ? 's' : ''}`;
  }

  function formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return date.toLocaleDateString();
  }

  function getProgressColor(progress: number) {
    if (progress >= 100) return 'var(--color-success)';
    if (progress > 0) return 'var(--color-primary)';
    return 'var(--color-border)';
  }

  $: progressColor = getProgressColor(thread.readProgress);

  let displayTitle = '';
  let displayDescription = '';



  $: {
      // Use thread title if available, otherwise first tweet
      if (thread.title) {
          displayTitle = thread.title;
          displayDescription = thread.tweets?.[0]?.content || '';
      } else {
          // Fallback to first tweet content
          displayTitle = thread.tweets?.[0]?.content || 'Untitled Thread';
          displayDescription = '';
      }
  }
</script>

<a href="#/thread/{thread.id}" class="thread-card-link">
  <article class="thread-card" class:unread={!thread.isRead}>
    {#if !thread.isRead}
        <div class="unread-indicator"></div>
    {/if}
    <div class="card-content">
      <div class="card-header">
      <div class="author-info">
        <div class="author-avatar">
          {thread.author.charAt(1).toUpperCase()}
        </div>
        <div class="author-details">
          <span class="author-name">{thread.author}</span>
          <span class="thread-date">{formatDate(thread.createdAt)}</span>
        </div>
      </div>
      <div class="card-badges">
        {#if thread.isFavorite}
          <span class="badge favorite" title="Favorite">⭐</span>
        {/if}
        {#if thread.isArchived}
          <span class="badge archived" title="Archived">📦</span>
        {/if}
        {#if !thread.isRead}
          <span class="badge unread-badge">New</span>
        {/if}
      </div>
    </div>

    <div class="title-container">
        <h3 class="thread-title">
        {displayTitle}
        </h3>
        {#if displayDescription}
            <div class="thread-subtitle">{displayDescription}</div>
        {/if}
    </div>

    <div class="card-footer">
      <div class="thread-meta">
        <span class="meta-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {getTweetCount(thread)}
        </span>
        {#if thread.readProgress > 0 && thread.readProgress < 100}
          <span class="meta-item ml-2" title="{Math.round(thread.readProgress)}% read">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="progress-ring">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.1)" stroke-width="3" fill="none"/>
              <path d="M12 2 A10 10 0 0 1 {12 + 10 * Math.sin(2 * Math.PI * thread.readProgress / 100)} {12 - 10 * Math.cos(2 * Math.PI * thread.readProgress / 100)}" 
                    stroke="var(--color-primary)" 
                    stroke-width="3" 
                    fill="none"
                    stroke-linecap="round" />
            </svg>
          </span>
        {/if}
      </div>
      {#if thread.tags.length > 0}
        <div class="thread-tags">
          {#each thread.tags.slice(0, 3) as tag}
            <span class="tag-mini">#{tag}</span>
          {/each}
          {#if thread.tags.length > 3}
            <span class="tag-mini">+{thread.tags.length - 3}</span>
          {/if}
        </div>
      {/if}
    </div>
    
    </div><!-- Close card-content -->
    
    <div class="progress-bar-bottom" style="--progress: {thread.readProgress}%; --color: {progressColor}"></div>
  </article>
</a>

<style>
  .thread-card {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition-base);
    animation: fadeIn var(--transition-base) ease-out;
    position: relative;
    overflow: hidden;
    width: 100%;
    text-align: left;
    display: flex;
    flex-direction: column;
    min-height: 200px;
    padding: 0; /* Remove padding from main card, move to content */
  }



  .unread-indicator {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--gradient-primary);
      box-shadow: 0 0 10px var(--color-primary);
      z-index: 2;
  }

  .card-content {
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      flex: 1;
  }

  .thread-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--gradient-primary);
    opacity: 0;
    transition: opacity var(--transition-base);
  }

  .thread-card.unread::before {
    opacity: 1;
  }

  .thread-card:hover {
    border-color: var(--color-border-light);
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-md);
  }

  .author-info {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .author-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--gradient-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: white;
    font-size: 1rem;
  }

  .author-details {
    display: flex;
    flex-direction: column;
  }

  .author-name {
    font-weight: 600;
    color: var(--color-text-primary);
    font-size: 0.9rem;
  }

  .thread-date {
    font-size: 0.8rem;
    color: var(--color-text-tertiary);
  }

  .card-badges {
    display: flex;
    gap: var(--space-xs);
    align-items: center;
  }

  .badge {
    font-size: 1rem;
  }

  .unread-badge {
    background: var(--gradient-primary);
    color: white;
    padding: 0.125rem 0.5rem;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .title-container {
      margin-bottom: var(--space-md);
      flex: 1;
  }

  .thread-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: 0.25rem;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .thread-subtitle {
     font-size: 0.95rem;
     color: var(--color-text-secondary);
     line-height: 1.5;
     font-weight: 400;
     display: -webkit-box;
     -webkit-line-clamp: 3;
     line-clamp: 3;
     -webkit-box-orient: vertical;
     overflow: hidden;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    flex-wrap: wrap;
    margin-top: auto; 
  }

  .thread-meta {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8rem;
    color: var(--color-text-tertiary);
  }

  .meta-item svg {
    color: var(--color-text-tertiary);
  }
  
  .meta-item svg.progress-ring {
      transform: rotate(-90deg);
  }

  .ml-2 {
      margin-left: 0.5rem;
  }

  .thread-tags {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .tag-mini {
    font-size: 0.7rem;
    color: var(--color-text-tertiary);
    background: var(--color-bg-tertiary);
    padding: 0.125rem 0.5rem;
    border-radius: 999px;
    font-weight: 500;
  }
</style>
