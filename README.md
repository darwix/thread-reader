# Twitter Thread Reader

A modern, distraction-free reader for Twitter (X) threads. Save, organize, and share your favorite threads.

## Features

### 🧵 Thread Management
- **Smart Scraping:**
    - Forward-scraping starting from the **first tweet** (supports `fxtwitter` and `vxtwitter` proxies).
    - Backward-scraping starting from any tweet in the thread.
    - Automatic fallback to OEmbed or manual input if scraping fails.
- **Media Archiving:** Automatically downloads and re-hosts images from Twitter to Supabase Storage, ensuring content remains available even if the original tweet is deleted.
- **Organization:**
    - Group threads into **Series** for sequential reading.
    - Tagging system for easy categorization.
    - Favorite, Archive, and Mark as Read status tracking.
- **Progress Tracking:** Remembers your reading position within each thread.

### 🌐 Sharing & Accessibility
- **Public Sharing:** Toggle any thread or series to "Public" to generate a unique shareable link.
- **Guest Access:** Shared content can be viewed by anyone without requiring a login.
- **Search & Filter:** Powerful search and filtering by author, title, tags, and reading status.

### 🛠 Technical Highlights
- **Framework:** Built with Svelte and Tailwind CSS for a fast, responsive, and dark-themed UI.
- **Backend:** Powered by Supabase (Auth, Database, Storage).
- **Security:** RLS (Row Level Security) policies ensure users only access their own data, while allowing anonymous access to public shared content.
- **CI/CD:** Automated database migrations and GitHub Pages deployment via GitHub Actions.
- **Authentication:** Secure Email/Password login.

## Recommendations for Improvement

1.  **Modular Scraping Service:** Move scraping logic from the frontend to a dedicated service or Supabase Edge Function to improve reliability and bypass potential CORS/rate-limiting issues.
2.  **Export Options:** Implement PDF and Markdown export for offline archiving and note-taking.
3.  **Browser Extension:** Create a browser extension to allow "one-click" saving of threads directly from twitter.com.
4.  **Live Updates:** Add a "Refresh" button to fetch new replies for ongoing threads.
5.  **Enhanced Reader UI:** Add customization options for font size, line height, and themes (Light/Sepia).
6.  **Full-Text Search:** Leverage Supabase's full-text search indexing for searching deep within the content of tweets.
7.  **Dynamic Previews:** Generate Open Graph (OG) images for public links to improve social media appearance.
8.  **Video Support:** Expand the scraper to support video extraction where possible.

## Browser Extension

The project includes a Chrome Extension that allows you to save threads directly from the Twitter/X interface.

### Installation
1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode** (toggle in the top right).
3.  Click **Load unpacked** and select the `extension` folder from this repository.
4.  Configure the extension:
    - Open `extension/config.js` and fill in your `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
5.  Click the extension icon in your browser and log in with your email and password.

### Usage
- Navigate to any tweet on Twitter/X.
- You will see a new "Save to Reader" icon (circle with a checkmark) in the tweet's action bar.
- Click it to automatically scrape and save the thread to your Reader app.

## Setup & Deployment

1.  **Supabase Setup:**
    - Create a new project.
    - Run the migrations in the `supabase/migrations` folder.
    - Enable `thread-media` storage bucket (Public).
2.  **Environment Variables:**
    - `VITE_SUPABASE_URL`: Your Supabase Project URL.
    - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
3.  **Deployment:**
    - Set up repository secrets for GitHub Actions (see `.github/workflows/deploy.yml`).
    - Pushing to `main` will automatically run migrations and deploy the site.
