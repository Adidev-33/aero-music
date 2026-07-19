import React from "react";

export default function BottomNavBar({ activeTab, setActiveTab }) {
  const isLibraryActive = activeTab === "library" || activeTab === "likedsongs" || activeTab.startsWith("playlist");

  return (
    <nav className="flex md:hidden fixed bottom-0 left-0 w-full h-16 bg-surface/90 backdrop-blur-2xl border-t border-white/10 z-50 justify-around items-center text-on-surface-variant shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
      {/* Home */}
      <button
        onClick={() => setActiveTab("home")}
        className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
          activeTab === "home" ? "text-primary" : "text-on-surface-variant opacity-75"
        }`}
      >
        <span 
          className="material-symbols-outlined text-[24px]" 
          style={{ fontVariationSettings: activeTab === "home" ? "'FILL' 1" : "'FILL' 0" }}
        >
          home
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider">Home</span>
      </button>

      {/* Search */}
      <button
        onClick={() => setActiveTab("search")}
        className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
          activeTab === "search" ? "text-primary" : "text-on-surface-variant opacity-75"
        }`}
      >
        <span 
          className="material-symbols-outlined text-[24px]" 
          style={{ fontVariationSettings: activeTab === "search" ? "'FILL' 1" : "'FILL' 0" }}
        >
          search
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider">Search</span>
      </button>

      {/* Library */}
      <button
        onClick={() => setActiveTab("library")}
        className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
          isLibraryActive ? "text-primary" : "text-on-surface-variant opacity-75"
        }`}
      >
        <span 
          className="material-symbols-outlined text-[24px]" 
          style={{ fontVariationSettings: isLibraryActive ? "'FILL' 1" : "'FILL' 0" }}
        >
          library_music
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider">Library</span>
      </button>

      {/* Now Playing */}
      <button
        onClick={() => setActiveTab("nowplaying")}
        className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
          activeTab === "nowplaying" ? "text-primary" : "text-on-surface-variant opacity-75"
        }`}
      >
        <span 
          className="material-symbols-outlined text-[24px]" 
          style={{ fontVariationSettings: activeTab === "nowplaying" ? "'FILL' 1" : "'FILL' 0" }}
        >
          play_circle
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider">Player</span>
      </button>

      {/* Lyrics */}
      <button
        onClick={() => setActiveTab("lyrics")}
        className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
          activeTab === "lyrics" ? "text-primary" : "text-on-surface-variant opacity-75"
        }`}
      >
        <span 
          className="material-symbols-outlined text-[24px]" 
          style={{ fontVariationSettings: activeTab === "lyrics" ? "'FILL' 1" : "'FILL' 0" }}
        >
          lyrics
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider">Lyrics</span>
      </button>
    </nav>
  );
}
