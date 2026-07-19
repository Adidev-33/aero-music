import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { registerSW } from './registerSW'
import App from './App.jsx'
import HomeView from './components/HomeView'
import SearchView from './components/SearchView'
import NowPlayingView from './components/NowPlayingView'
import LyricsView from './components/LyricsView'
import LibraryView from './components/LibraryView'
import LikedSongsView from './components/LikedSongsView'
import PlaylistView from './components/PlaylistView'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<HomeView />} />
          <Route path="search" element={<SearchView />} />
          <Route path="nowplaying" element={<NowPlayingView />} />
          <Route path="lyrics" element={<LyricsView />} />
          <Route path="library" element={<LibraryView />} />
          <Route path="likedsongs" element={<LikedSongsView />} />
          <Route path="playlist/:name" element={<PlaylistView />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)

// Register PWA service worker
registerSW()
