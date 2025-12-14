<script lang="ts">
    import { slide } from 'svelte/transition';
    import { threads } from './store';
  
    export let isOpen: boolean;
    export let onClose: () => void;
  
    let url = '';
    let author = '';
    let title = '';
    let content = '';
    let tags: string[] = [];
    let tagInput = '';

    function addTag(tag: string) {
        const cleanTag = tag.trim().replace(/^#/, '');
        if (cleanTag && !tags.includes(cleanTag)) {
            tags = [...tags, cleanTag];
        }
    }

    function removeTag(tagToRemove: string) {
        tags = tags.filter(t => t !== tagToRemove);
    }

    function addTagFromInput() {
        if (tagInput) {
            addTag(tagInput);
            tagInput = '';
        }
    }

    function handleTagKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTagFromInput();
        } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        }
    }
  
    let autofilling = false;
    let isSaving = false;
    let fetchedCount = 0;
    let saveError = '';
    let showManualInput = false;
  
    async function handleAutofill() {
      if (!url) return;
      
      // Extract ID
      const idMatch = url.match(/status\/(\d+)/);
      if (!idMatch) return;
      let currentId = idMatch[1];
      let threadTweets: any[] = [];
      
      showManualInput = false; // Reset
      
      try {
        autofilling = true;
        let iterations = 0;
        fetchedCount = 0;
        const MAX_TWEETS = import.meta.env.VITE_MAX_TWEETS ? parseInt(import.meta.env.VITE_MAX_TWEETS) : 400;
        let hasParent = true;
  
        while (hasParent && iterations < MAX_TWEETS) {
            const res = await fetch(`https://api.fxtwitter.com/status/${currentId}`);
            
            // FXTwitter returns 401/404 with JSON often
            const data = await res.json();
  
            if (!res.ok || data.code === 401 || data.message === 'PRIVATE_TWEET') {
                 if (data.message === 'PRIVATE_TWEET' || data.code === 401) {
                     saveError = "This tweet is from a private account. Please enter details manually.";
                     showManualInput = true;
                     throw new Error('Private tweet');
                 }
                 throw new Error(data.message || 'Failed to fetch tweet data');
            }
            
            const tweet = data.tweet;
  
            if (!tweet) break;
  
            // Add to beginning of array since we are going backwards
            threadTweets.unshift(tweet);
            fetchedCount = threadTweets.length;
  
            // Check for parent
            if (tweet.replying_to_status) {
                currentId = tweet.replying_to_status;
                iterations++;
                // Small delay to be nice to the API
                await new Promise(r => setTimeout(r, 200));
            } else {
                hasParent = false;
            }
        }
        
        if (threadTweets.length === 0) throw new Error('No tweets found');
  
        const mainTweet = threadTweets[0]; // The first chronological tweet
  
        // Update Author
        if (mainTweet.author) {
          author = '@' + mainTweet.author.screen_name;
        }
  
        // Update Content - Join tweets with double newlines, including images
        content = threadTweets.map(t => {
          let text = t.text;
          if (t.media?.photos) {
              t.media.photos.forEach((photo: any) => {
                  text += `\n![image](${photo.url})`;
              });
          }
          return text;
        }).join('\n\n');
        
        // Smart title generation from first tweet
        if (!title) {
            const firstSentence = mainTweet.text.split(/[.!?\n]/, 1)[0];
            title = firstSentence.length < 140 ? firstSentence : firstSentence.slice(0, 140) + '...';
        }
  
        // Add tags if we find hashtags in ANY tweet
        const allText = threadTweets.map(t => t.text).join(' ');
        const hashtags = allText.match(/#[a-zA-Z0-9_]+/g);
        if (hashtags) {
            // Unique tags
            const uniqueTags = [...new Set(hashtags.map((h: string) => h.slice(1)))];
            tags = uniqueTags;
        }
  
      } catch (e: any) {
        console.error('Autofill failed:', e);
        if (e.message !== 'Private tweet') {
             // Fallback to OEmbed if fxtwitter fails
            try {
              const res = await fetch(`https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`);
              if (res.ok) {
                 const data = await res.json();
                 if (data.author_url) {
                   const authorMatch = data.author_url.match(/twitter\.com\/([^\/]+)/);
                   if (authorMatch) author = '@' + authorMatch[1];
                 }
                 if (data.html) {
                   const parser = new DOMParser();
                   const doc = parser.parseFromString(data.html, 'text/html');
                   const p = doc.querySelector('p');
                   if (p && p.textContent) content = p.textContent;
                   
                   // If we only got one tweet, user might need to add more
                   if (content) {
                       saveError = "We could only fetch the first tweet. Please check content.";
                       showManualInput = true;
                   }
                 }
              } else {
                  showManualInput = true;
                  saveError = "Could not fetch thread automatically. Please enter manually.";
              }
            } catch (err) {
              console.error('Fallback failed:', err);
              showManualInput = true;
              saveError = "Could not fetch thread automatically. Please enter manually.";
            }
        }
      } finally {
        autofilling = false;
      }
    }

  async function handleSubmit() {
    if (!url || !author || !content) return;

    isSaving = true;
    saveError = '';

    try {
      // Parse tweets from content
      // Split by double newlines, but verify we aren't splitting inside an image tag if user messed up spacing
      // We assume standard double newline separation
      const rawTweets = content
        .split(/\n\n+/)
        .map(t => t.trim())
        .filter(t => t.length > 0);
      
      const tweets = rawTweets.map((block, index) => {
        // Extract images defined as ![image](url)
        const mediaUrls: string[] = [];
        const contentWithoutImages = block.replace(/!\[image\]\((.*?)\)/g, (_, url) => {
            mediaUrls.push(url);
            return '';
        }).trim();

        // Remove numbering like "1." or "1)"
        const cleanContent = contentWithoutImages.replace(/^\d+[\.)]\s*/, '');

        return {
            id: crypto.randomUUID(),
            content: cleanContent,
            order: index,
            mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined
        };
      });

      await threads.addThread({
        title: title || `Thread by ${author}`,
        author,
        url,
        tweets,
        tags
      });

      // Reset form
      url = '';
      author = '';
      title = '';
      content = '';
      tags = [];
      tagInput = '';
      
      onClose();
    } catch (e: any) {
      console.error('Failed to save thread:', e);
      saveError = e.message || 'Failed to save thread. Please try again.';
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
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="add-thread-modal" on:click|stopPropagation>
      <div class="modal-header">
        <h2 id="modal-title">Add New Thread</h2>
        <button class="icon-btn" on:click={onClose} aria-label="Close modal" disabled={isSaving}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
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
          <label for="thread-url">Twitter Thread URL *</label>
          <div class="input-with-action">
            <input 
              type="url" 
              id="thread-url" 
              bind:value={url}
              on:blur={handleAutofill}
              placeholder="https://twitter.com/username/status/..." 
              required
              disabled={isSaving}
            />
            <button 
              type="button" 
              class="btn-sm btn-secondary" 
              on:click={handleAutofill}
              disabled={!url || autofilling || isSaving}
            >
              {#if autofilling}
                <span class="loading-dots">Fetching {fetchedCount > 0 ? `(${fetchedCount})` : ''}</span>
              {:else}
                Autofill
              {/if}
            </button>
          </div>
          <small class="helper-text">
            For full threads, paste the URL of the <strong>last tweet</strong> in the thread. We'll fetch the rest automatically.
          </small>
        </div>

        <div class="form-group">
          <label for="thread-author">Author *</label>
          <input 
            type="text" 
            id="thread-author" 
            bind:value={author}
            placeholder="@username" 
            required
            disabled={isSaving}
          />
        </div>

        <div class="form-group">
          <label for="thread-title">Thread Title (Optional)</label>
          <input 
            type="text" 
            id="thread-title" 
            bind:value={title}
            placeholder="Give this thread a memorable title"
            disabled={isSaving}
          />
        </div>

        <!-- Content Field - Shown if manual input needed -->
        {#if showManualInput}
          <div class="form-group" transition:slide>
            <div class="label-row">
                <label for="thread-content">Thread Content *</label>
            </div>
            <textarea 
              id="thread-content" 
              bind:value={content}
              placeholder="Paste the full thread content here..." 
              required
              disabled={isSaving}
            ></textarea>
            <small class="helper-text">
                Autofill failed or account is private. Please copy and paste the thread content manually.
                Separate tweets with double newlines.
            </small>
          </div>
        {/if}

        <div class="form-group">
          <label for="thread-tags">Tags</label>
          <div class="tags-input-container">
            {#each tags as tag}
                <div class="tag-pill">
                    #{tag}
                    <button type="button" class="remove-tag" on:click={() => removeTag(tag)} aria-label="Remove tag {tag}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            {/each}
            <input 
                type="text" 
                bind:value={tagInput}
                on:keydown={handleTagKeydown}
                on:blur={addTagFromInput}
                placeholder={tags.length === 0 ? "tech, ai, productivity" : "Add tag..."}
                class="tag-input-field"
                disabled={isSaving}
            />
          </div>
          <small class="helper-text">Press Enter or Comma to add tags</small>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" on:click={onClose} disabled={isSaving}>Cancel</button>
          <button type="submit" class="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Thread'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .error-message {
    background-color: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    padding: var(--space-sm);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-md);
    font-size: 0.9rem;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .helper-text {
    font-size: 0.8rem;
    color: var(--color-text-tertiary);
    margin-top: 4px;
    display: block;
  }

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
    z-index: 0;
  }


  .add-thread-modal {
    width: 100%;
    max-width: 600px;
    padding: var(--space-xl);
    position: relative;
    z-index: 10;
    background: #0F172A;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    cursor: default;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-xl);
  }

  .modal-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
  }



  label {
    font-weight: 600;
    color: var(--color-text-primary);
    font-size: 0.9rem;
  }

  .input-with-action {
    display: flex;
    gap: var(--space-sm);
  }
  
  .input-with-action input {
    flex: 1;
  }
  
  .btn-sm {
    padding: var(--space-xs) var(--space-sm);
    font-size: 0.85rem;
  }

  small {
    color: var(--color-text-tertiary);
    font-size: 0.8rem;
  }

  textarea {
    resize: vertical;
    min-height: 200px;
  }

  .form-actions {
    display: flex;
    gap: var(--space-md);
    justify-content: flex-end;
    margin-top: var(--space-md);
  }

  @media (max-width: 768px) {
    .add-thread-modal {
      padding: var(--space-lg);
    }
    
    .input-with-action {
       flex-direction: column;
    }

    .form-actions {
      flex-direction: column-reverse;
    }

    .form-actions button {
      width: 100%;
    }
  }

  /* Tag Styling */
  .tags-input-container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg-tertiary);
    min-height: 42px;
  }

  .tag-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: var(--gradient-primary);
    color: white;
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 0.85rem;
  }

  .remove-tag {
    background: none;
    border: none;
    color: white;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
  }

  .remove-tag:hover {
    opacity: 1;
  }

  .tag-input-field {
    flex: 1;
    min-width: 80px;
    background: transparent !important;
    border: none !important;
    padding: 0 4px !important;
    color: var(--color-text-primary);
    font-size: 0.9rem;
    height: 100%;
  }

  .tag-input-field:focus {
    outline: none;
  }
</style>
