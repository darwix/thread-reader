<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { router } from './router';
  import { threads, type Thread } from './store';
  import './ThreadReader.css';

  export let id: string | undefined = undefined; 
  export let thread: Thread | null = null; 

  let loadingPage = false; 

  async function preloadImages(urls: string[]) {
    const promises = urls.map(url => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.onload = resolve;
            img.onerror = resolve; // Continue even if one fails
        });
    });
    await Promise.all(promises);
  } 

  let currentIndex = 0; // 0 represents the cover page (First Tweet)
  let direction = 1; // 1 for next, -1 for prev
  let touchStartX = 0;
  let touchEndX = 0;
  
  // If id is provided but thread isn't, find it
  // Reactive update of thread from store when id changes or store updates
  $: if (id && $threads.length > 0) {
      const found = $threads.find(t => t.id === id);
      if (found) {
          // If we are loading this thread for the first time (or switching threads), init progress
          if (!thread || thread.id !== id) {
             if (found.readProgress > 0) {
                const totalPages = found.tweets.length; 
                const targetPage = Math.floor((found.readProgress / 100) * totalPages);
                currentIndex = Math.max(0, Math.min(targetPage, found.tweets.length - 1));
             } else {
                currentIndex = 0;
             }
          }
          thread = found;
      }
  }

  // Derived values
  let displayTitle = '';
  // Description is now the first tweet content
  let displayDescription = '';

  $: if (thread) {
      if (thread.tweets.length > 0) {
          displayDescription = thread.tweets[0].content;
      }
      displayTitle = thread.title;
  }

  $: currentTweet = thread ? thread.tweets[currentIndex] : null;
  $: currentLink = currentTweet ? extractFirstLink(currentTweet.content) : null;

  function handleClose() {
      router.navigate('/');
  }

  function updateProgress() {
    if (!thread) return;
    
    const totalPages = thread.tweets.length;
    // progress is page index / total pages
    const progress = ((currentIndex + 1) / totalPages) * 100;
    
    threads.updateProgress(thread.id, progress);
    
    if (currentIndex === thread.tweets.length - 1 && !thread.isRead) {
        threads.markAsRead(thread.id);
    }
  }

  async function nextPage() {
    if (!thread || currentIndex >= thread.tweets.length - 1 || loadingPage) return;
    
    // Check if next page has images
    const nextTweet = thread.tweets[currentIndex + 1];
    if (nextTweet && nextTweet.mediaUrls && nextTweet.mediaUrls.length > 0) {
        loadingPage = true;
        await preloadImages(nextTweet.mediaUrls);
        loadingPage = false;
    }

    direction = 1;
    currentIndex++;
    updateProgress();
  }

  function prevPage() {
    if (currentIndex <= 0) return;
    direction = -1;
    currentIndex--;
    updateProgress();
  }

  // Image Zoom State
  let zoomedImage: string | null = null;

  function openImage(url: string) {
    zoomedImage = url;
  }

  function closeImage() {
    zoomedImage = null;
  }

  // Delete Confirmation State
  let showDeleteModal = false;

  function handleDelete() {
      if (thread) {
          threads.deleteThread(thread.id);
          showDeleteModal = false;
          handleClose();
      }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (zoomedImage && thread) {
        if (event.key === 'Escape') {
            closeImage();
            return;
        }

        const activeTweet = thread.tweets[currentIndex];
        const images = activeTweet.mediaUrls || [];
        
        if (images.length > 1) {
            const currentImgIndex = images.indexOf(zoomedImage);
            
            if (event.key === 'ArrowRight') {
                event.preventDefault(); // Prevent page navigation/scroll
                const nextIndex = currentImgIndex + 1;
                if (nextIndex < images.length) {
                    zoomedImage = images[nextIndex];
                }
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                const prevIndex = currentImgIndex - 1;
                if (prevIndex >= 0) {
                    zoomedImage = images[prevIndex];
                }
            }
        }
        return;
    }

    if (event.key === 'ArrowRight' || event.key === 'Space') {
      nextPage();
    } else if (event.key === 'ArrowLeft') {
      prevPage();
    } else if (event.key === 'Escape') {
      handleClose();
    }
  }

  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.changedTouches[0].screenX;
  }

  function handleTouchEnd(e: TouchEvent) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }

  function handleSwipe() {
    const SWIPE_THRESHOLD = 50;
    if (touchEndX < touchStartX - SWIPE_THRESHOLD) {
      nextPage();
    }
    if (touchEndX > touchStartX + SWIPE_THRESHOLD) {
      prevPage();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
</script>

{#if thread}
  <div class="reader-page" on:touchstart={handleTouchStart} on:touchend={handleTouchEnd}>
    <header class="reader-header-minimal">
      <button class="btn-icon" on:click={handleClose} title="Back to Library">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="icon">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="reader-actions">
          <button class="btn-icon" on:click={() => thread && threads.toggleFavorite(thread.id)} title={thread.isFavorite ? "Unfavorite" : "Favorite"}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={thread.isFavorite ? "currentColor" : "none"} stroke="currentColor" class="icon {thread.isFavorite ? 'favorite-active' : ''}">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          
          <button class="btn-icon" on:click={() => thread && threads.toggleArchive(thread.id)} title={thread.isArchived ? "Unarchive" : "Archive"}>
             <svg width="20" height="20" viewBox="0 0 24 24" fill={thread.isArchived ? "currentColor" : "none"} stroke="currentColor" class="icon {thread.isArchived ? 'archive-active' : ''}">
                <path d="M21 8v13H3V8M1 3h22v5H1V3zM10 12h4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
             </svg>
          </button>
          
          <button class="btn-icon danger" on:click={() => showDeleteModal = true} title="Delete Thread">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="icon">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
             </svg>
          </button>
      </div>
    </header>

    <main class="book-container">
      {#if loadingPage}
          <div class="page-loader" transition:fade={{ duration: 200 }}>
              <div class="spinner-large"></div>
          </div>
      {/if}
      {#key currentIndex}
        <div 
          class="book-page"
          in:fly={{ x: direction * 50, duration: 300, opacity: 0 }}
          out:fade={{ duration: 200 }}
        >
          {#if currentIndex === 0}
             <!-- Cover Page (First Tweet) -->
             <div class="page-cover">
                {#if thread.tweets[0].mediaUrls && thread.tweets[0].mediaUrls.length > 0}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div class="cover-image-container" on:click={() => thread?.tweets[0].mediaUrls && openImage(thread.tweets[0].mediaUrls[0])} role="button" tabindex="0" style="cursor: zoom-in;">
                        <img src={thread.tweets[0].mediaUrls[0]} alt="Cover" class="cover-image" />
                    </div>
                {/if}
                <div class="cover-content">
                    <h1 class="book-title">{displayTitle || 'Untitled Thread'}</h1>
                    
                    <div class="book-description">
                        {@html formatContent(thread.tweets[0].content)}
                    </div>

                    <div class="book-author">
                        <div class="author-avatar">{thread.author.charAt(0).toUpperCase()}</div>
                        <span>{thread.author}</span>
                    </div>
                    <div class="book-meta">
                        <span>{thread.tweets.length} Pages</span>
                        <span>•</span>
                        <span>{new Date(thread.createdAt).getFullYear()}</span>
                    </div>
                    
                    {#if thread.tweets.length > 1}
                        <button class="btn-primary start-button" on:click={nextPage}>
                            Continue Reading
                        </button>
                    {/if}
                </div>
             </div>
          {:else}
             <!-- Content Page (Subsequent Tweets) -->
             <div class="page-content">
                 <div class="page-watermark">{currentIndex + 1}</div>
                 <div class="tweet-text">{@html formatContent(thread.tweets[currentIndex].content)}</div>
                 
                 {#if currentLink}
                    <a href={currentLink} target="_blank" rel="noopener noreferrer" class="link-preview-card">
                        <div class="link-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                        </div>
                        <div class="link-info">
                            <div class="link-domain">{getDomain(currentLink)}</div>
                            <div class="link-url">{currentLink}</div>
                        </div>
                        <div class="link-arrow">
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                             </svg>
                        </div>
                    </a>
                 {/if}
                 
                 {#if thread?.tweets[currentIndex]?.mediaUrls?.length}
                    <div class="tweet-media-grid">
                        {#each thread.tweets[currentIndex].mediaUrls as url}
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <div class="image-wrapper" on:click={() => openImage(url)} role="button" tabindex="0">
                                <img src={url} alt="Tweet media" class="book-image" loading="lazy" />
                            </div>
                        {/each}
                    </div>
                 {/if}
             </div>
          {/if}
        </div>
      {/key}
    </main>

    <!-- Footer Controls -->
    <div class="reader-controls">
        <button class="control-btn" on:click={prevPage} disabled={currentIndex <= 0} title="Previous Page">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="icon">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>

        <div class="footer-center">
            <span class="page-count">{currentIndex + 1} / {thread.tweets.length}</span>
            <div class="progress-bar-container">
                <div class="progress-fill" style="width: {((currentIndex + 1) / thread.tweets.length) * 100}%"></div>
            </div>
        </div>

        <button class="control-btn" on:click={nextPage} disabled={currentIndex >= thread.tweets.length - 1 || loadingPage} title="Next Page">
            {#if loadingPage}
                <div class="spinner-small"></div>
            {:else}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="icon">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            {/if}
        </button>
    </div>
    
    <!-- Image Lightbox Modal -->
    {#if zoomedImage}
        <div class="lightbox-overlay" on:click={closeImage} transition:fade={{ duration: 200 }} role="button" tabindex="0" on:keydown={(e) => e.key === 'Escape' && closeImage()}>
            <div class="lightbox-content">
                <img src={zoomedImage} alt="Zoomed view" class="lightbox-image" />
                <button class="lightbox-close" on:click|stopPropagation={closeImage} aria-label="Close Zoom">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="icon">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
    {/if}


    <!-- Delete Confirmation Modal -->
    {#if showDeleteModal}
        <div class="modal" role="dialog" aria-modal="true">
            <div class="modal-overlay" on:click={() => showDeleteModal = false} role="button" tabindex="0" on:keydown={(e) => e.key === 'Escape' && (showDeleteModal = false)} aria-label="Close modal"></div>
            <div class="modal-content delete-modal" role="document">
                <h3>Delete Thread?</h3>
                <p>Are you sure you want to delete this thread? This action cannot be undone.</p>
                <div class="modal-actions">
                    <button class="btn-secondary" on:click={() => showDeleteModal = false}>Cancel</button>
                    <button class="btn-danger" on:click={handleDelete}>Delete</button>
                </div>
            </div>
        </div>
    {/if}
  </div>
{/if}

<script context="module">
  function formatContent(text: string): string {
    // Basic URL regex
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-link">${url}</a>`;
    });
  }

  function extractFirstLink(text: string): string | null {
    const match = text.match(/(https?:\/\/[^\s]+)/);
    return match ? match[0] : null;
  }
  
  function getDomain(url: string): string {
      try {
          return new URL(url).hostname;
      } catch {
          return 'link';
      }
  }
</script>
