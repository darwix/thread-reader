import { writable } from 'svelte/store';
import { supabase } from './supabase';

export interface Series {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  threadIds: string[]; // Order is important
  coverImage?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Store for series
function createSeriesStore() {
  const { subscribe, set, update } = writable<Series[]>([]);

  const fetchSeries = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        set([]);
        return;
    }

    const { data, error } = await supabase
      .from('series')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching series', error);
        return;
    }

    if (data) {
        set(data.map((s: any) => ({
            id: s.id,
            user_id: s.user_id,
            title: s.title,
            description: s.description,
            threadIds: s.thread_ids || [], // Adjust based on how we store it. JSONB or Array?
            // If using separate table series_threads, we need a join.
            // For MVP, assuming array column `thread_ids` in `series` table is easiest if list < 100.
            coverImage: s.cover_image,
            isPublic: s.is_public,
            createdAt: new Date(s.created_at),
            updatedAt: new Date(s.updated_at)
        })));
    }
  }

  return {
    subscribe,
    init: async () => {
        await fetchSeries();
        supabase.channel('public:series').on('postgres_changes', { event: '*', schema: 'public', table: 'series'}, fetchSeries).subscribe();
    },
    addSeries: async (series: Omit<Series, 'id' | 'createdAt' | 'updatedAt' | 'isPublic'>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase.from('series').insert({
            user_id: user.id,
            title: series.title,
            description: series.description,
            thread_ids: series.threadIds,
            cover_image: series.coverImage,
            is_public: false
        });
        
        if (error) throw error;
        await fetchSeries();
    },
    updateSeries: async (id: string, updates: Partial<Series>) => {
        const dbUpdates: any = {};
        if (updates.title) dbUpdates.title = updates.title;
        if (updates.description) dbUpdates.description = updates.description;
        if (updates.threadIds) dbUpdates.thread_ids = updates.threadIds;
        if (updates.coverImage) dbUpdates.cover_image = updates.coverImage;
        if (updates.isPublic !== undefined) dbUpdates.is_public = updates.isPublic;

        const { error } = await supabase.from('series').update(dbUpdates).eq('id', id);
        if (error) throw error;
        await fetchSeries();
    },
    deleteSeries: async (id: string) => {
        const { error } = await supabase.from('series').delete().eq('id', id);
        if (error) console.error(error);
        else await fetchSeries();
    },
    fetchPublicSeries: async (id: string): Promise<Series | null> => {
        const { data, error } = await supabase
            .from('series')
            .select('*')
            .eq('id', id)
            .eq('is_public', true)
            .single();

        if (error || !data) return null;
        return {
            id: data.id,
            user_id: data.user_id,
            title: data.title,
            description: data.description,
            threadIds: data.thread_ids || [],
            coverImage: data.cover_image,
            isPublic: data.is_public,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
        };
    }
  }
}

export const series = createSeriesStore();
