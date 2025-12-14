# Quick Start Guide

## Node Version Issue

If you're seeing an error about Node.js version when running `npm run dev`, you have two options:

### Option 1: Upgrade Node.js (Recommended)

1. Download and install Node.js 20.19+ or 22.12+ from [nodejs.org](https://nodejs.org/)
2. Restart your terminal
3. Run `npm run dev`

### Option 2: Use an Older Version of Vite

If you can't upgrade Node.js right now, you can downgrade Vite:

```bash
npm install vite@5 @sveltejs/vite-plugin-svelte@4 --save-dev
```

Then run:
```bash
npm run dev
```

## Loading Demo Data

Once the app is running:

1. Open your browser to `http://localhost:5173`
2. Open the browser console (F12 or Ctrl+Shift+I)
3. Type `loadDemoData()` and press Enter
4. Refresh the page to see 4 sample threads

This will give you a feel for how the app works before adding your own threads!

## Adding Your First Thread

1. Click the "Add Thread" button
2. Fill in the form:
   - **URL**: The Twitter thread URL
   - **Author**: The Twitter handle (e.g., @username)
   - **Title**: Optional, but helps you remember what the thread is about
   - **Content**: Copy and paste the thread. Separate tweets with blank lines
   - **Tags**: Add tags like "tech", "productivity", etc.
3. Click "Save Thread"

## Tips

- **Separate tweets**: When pasting thread content, make sure each tweet is separated by a blank line, or use numbering (1., 2., etc.)
- **Use tags**: Tags help you organize and find threads later
- **Reading progress**: The app automatically tracks how far you've read in each thread
- **Keyboard shortcuts**: Press Escape to close modals

## Clearing Data

To remove all threads and start fresh, open the browser console and run:
```javascript
clearAllData()
```

Then refresh the page.

---

Enjoy using ThreadReader! 🧵✨
