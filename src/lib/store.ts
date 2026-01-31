import { derived, writable } from 'svelte/store';
import { supabase } from './supabase';

export interface Tweet {
  id: string;
  content: string;
  order: number;
  mediaUrls?: string[];
}

export interface Thread {
  id: string;
  user_id?: string;
  title: string;
  author: string;
  url: string;
  tweets: Tweet[];
  tags: string[];
  createdAt: Date;
  isFavorite: boolean;
  isArchived: boolean;
  isRead: boolean;
  readProgress: number;
}

export type FilterType = 'all' | 'unread' | 'favorites' | 'archived' | 'series';
export type SortType = 'date-desc' | 'date-asc' | 'author' | 'length';

async function archiveMedia(url: string, userId: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch media: ${response.statusText}`);
    const blob = await response.blob();

    // Extract extension or default to jpg
    const urlWithoutQuery = url.split('?')[0];
    const fileExt = urlWithoutQuery.split('.').pop() || 'jpg';
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const path = `${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('thread-media')
      .upload(path, blob, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('thread-media')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (e) {
    console.error('Media archiving failed for:', url, e);
    return url; // Fallback to original URL
  }
}

// Create the main threads store
function createThreadsStore() {
  const { subscribe, set, update } = writable<Thread[]>([]);

  // Helper to sync state from Supabase
  const fetchThreads = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        set([]);
        return;
    }

    const { data, error } = await supabase
      .from('threads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching threads:', error);
      return;
    }

    if (data) {
      const formattedThreads: Thread[] = data.map((t: any) => ({
        ...t,
        createdAt: new Date(t.created_at),
        // Map snake_case to camelCase for internal use
        isFavorite: t.is_favorite,
        isArchived: t.is_archived,
        isRead: t.is_read,
        readProgress: t.read_progress
      }));
      set(formattedThreads);
    }
  };

  return {
    subscribe,
    init: async () => {
      await fetchThreads();
      
      // Subscribe to realtime changes
      supabase
        .channel('public:threads')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'threads' }, () => {
          fetchThreads();
        })
        .subscribe();
    },
    addThread: async (thread: Omit<Thread, 'id' | 'createdAt' | 'isFavorite' | 'isArchived' | 'isRead' | 'readProgress'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Archive media to Supabase Storage
      const archivedTweets = await Promise.all(thread.tweets.map(async (tweet) => {
        if (tweet.mediaUrls && tweet.mediaUrls.length > 0) {
          const newMediaUrls = await Promise.all(
            tweet.mediaUrls.map(url => archiveMedia(url, user.id))
          );
          return { ...tweet, mediaUrls: newMediaUrls };
        }
        return tweet;
      }));

      const { error } = await supabase.from('threads').insert({
        user_id: user.id,
        title: thread.title,
        author: thread.author,
        url: thread.url,
        tweets: archivedTweets,
        tags: thread.tags,
        is_favorite: false,
        is_archived: false,
        is_read: false,
        read_progress: 0
      });

      if (error) {
        console.error('Error adding thread:', error);
        throw error;
      }
      
      // Explicitly fetch threads to ensure UI updates immediately
      await fetchThreads();
    },
    updateThread: async (id: string, updates: Partial<Thread>) => {
      // Map camelCase to snake_case for DB
      const dbUpdates: any = {};
      if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite;
      if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;
      if (updates.isRead !== undefined) dbUpdates.is_read = updates.isRead;
      if (updates.readProgress !== undefined) dbUpdates.read_progress = updates.readProgress;
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

      const { error } = await supabase
        .from('threads')
        .update(dbUpdates)
        .eq('id', id);

      if (error) console.error('Error updating thread:', error);
    },
    deleteThread: async (id: string) => {
      const { error } = await supabase
        .from('threads')
        .delete()
        .eq('id', id);


      if (error) console.error('Error deleting thread:', error);
      else await fetchThreads();
    },
    toggleFavorite: async (id: string) => {
      let previousThreads: Thread[] = [];
      update(currentThreads => {
          previousThreads = currentThreads;
          const thread = currentThreads.find(t => t.id === id);
          if (thread) {
             const newVal = !thread.isFavorite;
             // Optimistic update
             return currentThreads.map(t => t.id === id ? { ...t, isFavorite: newVal } : t);
          }
          return currentThreads;
      });

      // Perform DB update
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Should handle auth error?

      const { data, error } = await supabase
        .from('threads')
        .update({ is_favorite: !previousThreads.find(t => t.id === id)?.isFavorite }) // Toggle relative to what it was
        // Wait, cleaner to just use the new value derived.
        // But hard to get "newVal" here without recalculating.
        // Let's rely on finding it again or just calculating based on previous.
        // Actually, we can just get the found thread from previousThreads.
        .eq('id', id)
        .select();
      
      if (error) {
          console.error('Failed to toggle favorite:', error);
          // Revert
          set(previousThreads);
      }
    },
    toggleArchive: async (id: string) => {
      let previousThreads: Thread[] = [];
      update(currentThreads => {
          previousThreads = currentThreads;
          const thread = currentThreads.find(t => t.id === id);
          if (thread) {
             const newVal = !thread.isArchived;
             return currentThreads.map(t => t.id === id ? { ...t, isArchived: newVal } : t);
          }
          return currentThreads;
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const thread = previousThreads.find(t => t.id === id);
      if (!thread) return;

      const { error } = await supabase
        .from('threads')
        .update({ is_archived: !thread.isArchived })
        .eq('id', id);

      if (error) {
          console.error('Failed to toggle archive:', error);
          set(previousThreads);
      }
    },
    markAsRead: async (id: string) => {
      update(threads => {
          supabase.from('threads').update({ is_read: true }).eq('id', id).then(console.error);
          return threads.map(t => t.id === id ? { ...t, isRead: true } : t);
      });
    },
    updateProgress: async (id: string, progress: number) => {
      const roundedProgress = Math.round(progress);
      update(threads => {
          supabase.from('threads').update({ read_progress: roundedProgress }).eq('id', id).then(console.error);
          return threads.map(t => t.id === id ? { ...t, readProgress: progress } : t);
      });
    }
  };
}

export const threads = createThreadsStore();

// Filter and sort stores
export const currentFilter = writable<FilterType>('all');
export const currentSort = writable<SortType>('date-desc');
export const searchQuery = writable<string>('');
export const selectedTag = writable<string | null>(null);

// Derived store for filtered and sorted threads
// Helper function for search filtering
function matchesSearch(thread: Thread, query: string): boolean {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    
    return (
        thread.title.toLowerCase().includes(q) ||
        thread.author.toLowerCase().includes(q) ||
        thread.tags.some(tag => tag.toLowerCase().includes(q))
    );
}

// Derived store for filtered and sorted threads
export const filteredThreads = derived(
  [threads, currentFilter, currentSort, searchQuery, selectedTag],
  ([$threads, $filter, $sort, $search, $tag]) => {
    let filtered = [...$threads];

    // Apply filter
    switch ($filter) {
      case 'unread':
        filtered = filtered.filter(t => !t.isRead);
        break;
      case 'favorites':
        filtered = filtered.filter(t => t.isFavorite);
        break;
      case 'archived':
        filtered = filtered.filter(t => t.isArchived);
        break;
      case 'series':
        return []; // Series are handled separately in UI

    }

    // Apply tag filter
    if ($tag) {
      filtered = filtered.filter(t => t.tags.includes($tag));
    }

    // Apply search
    if ($search && $search.trim()) {
      filtered = filtered.filter(t => matchesSearch(t, $search));
    }

    // Apply sort
    switch ($sort) {
      case 'date-desc':
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'date-asc':
        filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      case 'author':
        filtered.sort((a, b) => a.author.localeCompare(b.author));
        break;
      case 'length':
        filtered.sort((a, b) => b.tweets.length - a.tweets.length);
        break;
    }

    return filtered;
  }
);

// Derived store for all unique tags
export const allTags = derived(threads, $threads => {
  const tagSet = new Set<string>();
  $threads.forEach(thread => {
    thread.tags.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
});

// Derived store for counts
export const counts = derived([threads, searchQuery], ([$threads, $search]) => {
  let relevantThreads = $threads;
  
  // If there is a search filter, apply it to the counts too
  if ($search) {
      relevantThreads = $threads.filter(t => matchesSearch(t, $search));
  }

  return {
      all: relevantThreads.length,
      unread: relevantThreads.filter(t => !t.isRead).length,
      favorites: relevantThreads.filter(t => t.isFavorite).length,
      archived: relevantThreads.filter(t => t.isArchived).length
  };
});
