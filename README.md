# 🎵 Aero Music

A sleek, modern web-based music player that streams music directly from YouTube Music. Built with a glassmorphic dark UI, real-time search, queue management, lyrics display, and a fully responsive design.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)

## ✨ Features

- **🔍 Live Search** — Search songs, artists, albums, and playlists via YouTube Music
- **▶️ Streaming Playback** — Stream audio directly using the YouTube IFrame Player API
- **📃 Up Next Queue** — Auto-generated queue from YouTube Music's related tracks
- **🎤 Lyrics** — Fetches and displays lyrics with a preview snippet on the Now Playing screen
- **❤️ Library** — Like songs, view recently played, and create custom playlists (stored locally)
- **📱 Responsive** — Fully responsive layout with mobile bottom nav, side nav on desktop
- **🎨 Glassmorphic UI** — Modern dark theme with blur effects, smooth animations, and gradient accents

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS, React Router |
| **Backend** | Python, FastAPI, ytmusicapi |
| **Playback** | YouTube IFrame Player API |
| **Storage** | LocalStorage (liked songs, playlists, history) |

## 📁 Project Structure

```
aero-music/
├── backend/
│   ├── main.py              # FastAPI server with YouTube Music API endpoints
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── public/              # Favicons and static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchView.jsx       # Home search page with bento grid results
│   │   │   ├── NowPlayingView.jsx   # Album art, controls, queue, lyrics preview
│   │   │   ├── LyricsView.jsx       # Full lyrics display
│   │   │   ├── LibraryView.jsx      # Liked songs, recently played, playlists
│   │   │   ├── PlayerBar.jsx        # Bottom playback bar with controls
│   │   │   ├── SideNavBar.jsx       # Desktop sidebar navigation
│   │   │   └── BottomNavBar.jsx     # Mobile bottom navigation
│   │   ├── App.jsx          # Main app layout, state management, API calls
│   │   ├── main.jsx         # App entry point with routing
│   │   └── index.css        # Global styles and design tokens
│   ├── .env.production      # Production API URL
│   └── index.html           # HTML entry point
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.9

### 1. Clone the repository

```bash
git clone https://github.com/Adidev-33/aero-music.git
cd aero-music
```

### 2. Start the Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

The API server will start at `http://localhost:8000`.

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## 🌐 Deployment

### Backend (Render)

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. Set **Build Command** to `pip install -r requirements.txt`
5. Set **Start Command** to `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel)

1. Create a new project on [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Add environment variable: `VITE_API_URL` = your Render backend URL
5. Deploy

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/search?q={query}&filter={filter}` | Search YouTube Music |
| `GET` | `/api/song/{video_id}` | Get song details |
| `GET` | `/api/queue/{video_id}` | Get watch playlist / up next queue |
| `GET` | `/api/lyrics/{browse_id}` | Get lyrics by browse ID |

## 📄 License

This project is for educational and personal use only. All music content is streamed from YouTube Music.

---

**Built with ❤️ by [Adidev](https://github.com/Adidev-33)**
