import { CONFIG } from './config.js';

async function fetchTweet(id) {
    const res = await fetch(`https://api.fxtwitter.com/status/${id}`);
    if (!res.ok) throw new Error('Failed to fetch tweet');
    const data = await res.json();
    return data.tweet;
}

async function fetchThread(url) {
    const idMatch = url.match(/status\/(\d+)/);
    if (!idMatch) throw new Error('Invalid Twitter URL');
    let currentId = idMatch[1];
    let threadTweets = [];

    const mainTweet = await fetchTweet(currentId);

    if (mainTweet.thread && mainTweet.thread.length > 1) {
        threadTweets = mainTweet.thread;
    } else if (mainTweet.replying_to_status) {
        // Crawl backwards
        threadTweets.unshift(mainTweet);
        let parentId = mainTweet.replying_to_status;
        let iterations = 0;
        while (parentId && iterations < 40) {
            try {
                const tweet = await fetchTweet(parentId);
                threadTweets.unshift(tweet);
                parentId = tweet.replying_to_status;
                iterations++;
            } catch (e) {
                break;
            }
        }
    } else {
        // Try forward with vxtwitter
        threadTweets = [mainTweet];
        try {
            const vxRes = await fetch(`https://api.vxtwitter.com/status/${currentId}`);
            if (vxRes.ok) {
                const vxData = await vxRes.json();
                if (vxData.thread && Array.isArray(vxData.thread)) {
                    threadTweets = vxData.thread;
                }
            }
        } catch (e) {}
    }

    return threadTweets;
}

async function archiveMedia(url, userId, token) {
    try {
        const response = await fetch(url);
        if (!response.ok) return url;
        const blob = await response.blob();

        const fileExt = url.split('?')[0].split('.').pop() || 'jpg';
        const fileName = `${self.crypto.randomUUID()}.${fileExt}`;
        const path = `${userId}/${fileName}`;

        const uploadRes = await fetch(`${CONFIG.SUPABASE_URL}/storage/v1/object/thread-media/${path}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': CONFIG.SUPABASE_ANON_KEY
            },
            body: blob
        });

        if (!uploadRes.ok) return url;

        return `${CONFIG.SUPABASE_URL}/storage/v1/object/public/thread-media/${path}`;
    } catch (e) {
        return url;
    }
}

async function saveToSupabase(threadData, session) {
    const { user, access_token } = session;

    // Process tweets for storage
    const archivedTweets = await Promise.all(threadData.map(async (t, index) => {
        let text = t.text;
        const mediaUrls = [];
        if (t.media && t.media.photos) {
            for (const photo of t.media.photos) {
                const archivedUrl = await archiveMedia(photo.url, user.id, access_token);
                mediaUrls.push(archivedUrl);
            }
        }

        return {
            id: self.crypto.randomUUID(),
            content: text,
            order: index,
            mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined
        };
    }));

    const firstTweet = threadData[0];
    const author = '@' + firstTweet.author.screen_name;
    const firstSentence = firstTweet.text.split(/[.!?\n]/, 1)[0];
    const title = firstSentence.length < 140 ? firstSentence : firstSentence.slice(0, 140) + '...';

    const payload = {
        user_id: user.id,
        title: title,
        author: author,
        url: firstTweet.url,
        tweets: archivedTweets,
        tags: [],
        is_favorite: false,
        is_archived: false,
        is_read: false,
        is_public: false,
        read_progress: 0
    };

    const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/threads`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'apikey': CONFIG.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save to Supabase');
    }

    return true;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'save_thread') {
        (async () => {
            try {
                const { session } = await chrome.storage.local.get('session');
                if (!session) {
                    throw new Error('Not logged in. Please log in via the extension popup.');
                }

                const threadTweets = await fetchThread(request.url);
                await saveToSupabase(threadTweets, session);

                sendResponse({ success: true });
            } catch (error) {
                console.error('Extension save error:', error);
                sendResponse({ success: false, error: error.message });
            }
        })();
        return true; // Keep channel open for async response
    }
});
