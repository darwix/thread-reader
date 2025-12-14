# ThreadReader - Your Twitter Thread Library

A beautiful, modern web application for saving, organizing, and reading Twitter threads in a distraction-free interface.

![ThreadReader](https://img.shields.io/badge/Built%20with-Svelte-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

## ✨ Features

- **📚 Store & Organize**: Save Twitter threads with metadata (author, tags, URL)
- **🎨 Beautiful Reading Experience**: Clean, premium dark theme with smooth animations
- **🔍 Smart Search**: Search across thread titles, authors, content, and tags
- **🏷️ Tag System**: Organize threads with custom tags
- **📖 Reading Progress**: Automatically track your reading progress
- **⭐ Favorites & Archive**: Mark threads as favorites or archive them
- **💾 Local Storage**: All data stored locally in your browser
- **📱 Responsive Design**: Works beautifully on desktop, tablet, and mobile

## 🚀 Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+ (required by Vite 7)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd twitter-threads
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 📖 How to Use

### Adding a Thread

1. Click the **"Add Thread"** button in the header
2. Fill in the thread details:
   - **Twitter Thread URL**: The URL of the first tweet
   - **Author**: The Twitter handle (e.g., @username)
   - **Title** (optional): A memorable title for the thread
   - **Content**: Paste the thread content (separate tweets with blank lines or use numbering)
   - **Tags**: Add comma-separated tags for organization
3. Click **"Save Thread"**

### Reading a Thread

- Click on any thread card to open the reader
- Scroll through the thread in a beautiful, distraction-free interface
- Your reading progress is automatically saved
- Threads are marked as read when you scroll to 90%

### Organizing Threads

- **Search**: Use the search box to find threads by title, author, content, or tags
- **Filter**: Use the sidebar to filter by:
  - All Threads
  - Unread
  - Favorites
  - Archived
- **Tags**: Click on tags in the sidebar to filter by specific topics
- **Sort**: Sort threads by newest, oldest, author, or length

### Thread Actions

While reading a thread, you can:
- ⭐ **Add to Favorites**: Mark important threads
- 📦 **Archive**: Archive threads you've finished with
- 🗑️ **Delete**: Remove threads permanently

## 🎨 Design Features

- **Modern Dark Theme**: Easy on the eyes with carefully chosen colors
- **Gradient Accents**: Beautiful gradients for visual interest
- **Smooth Animations**: Micro-animations for enhanced UX
- **Glassmorphism**: Subtle backdrop blur effects
- **Premium Typography**: Using Inter and Playfair Display fonts
- **Responsive Layout**: Adapts beautifully to all screen sizes

## 🛠️ Tech Stack

- **Framework**: Svelte 5 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Vanilla CSS with CSS Variables
- **State Management**: Svelte Stores
- **Storage**: Browser LocalStorage API

## 📁 Project Structure

```
twitter-threads/
├── src/
│   ├── lib/
│   │   ├── Header.svelte          # App header component
│   │   ├── Sidebar.svelte         # Navigation sidebar
│   │   ├── ThreadCard.svelte      # Thread preview card
│   │   ├── AddThreadModal.svelte  # Modal for adding threads
│   │   ├── ThreadReader.svelte    # Thread reading interface
│   │   └── store.ts               # Svelte stores & state management
│   ├── App.svelte                 # Main app component
│   ├── app.css                    # Global styles & design system
│   └── main.ts                    # App entry point
├── index.html
├── package.json
└── vite.config.ts
```

## 🎯 Future Enhancements

- [ ] Import threads directly from Twitter URLs
- [ ] Export threads as PDF or Markdown
- [ ] Dark/Light theme toggle
- [ ] Cloud sync support
- [ ] Thread collections/folders
- [ ] Share threads with others
- [ ] Browser extension for quick saves

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

Built with ❤️ using Svelte
