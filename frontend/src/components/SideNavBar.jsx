import React from "react";

export default function SideNavBar({ activeTab, setActiveTab, currentTrack }) {
  const isLibraryActive = activeTab === "library" || activeTab === "likedsongs" || activeTab.startsWith("playlist");
  
  return (
    <nav className="hidden md:flex flex-col items-center py-panel-padding space-y-element-gap fixed left-8 top-1/2 -translate-y-1/2 w-20 h-[500px] rounded-lg bg-surface/40 backdrop-blur-3xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-20 shadow-2xl backdrop-saturate-150 justify-between">
      {/* Nav Buttons */}
      <div className="flex flex-col items-center space-y-6 flex-1 justify-center">
        {/* Home */}
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center group transition-all duration-300 rounded-xl p-3 w-16 ${
            activeTab === "home"
              ? "bg-white/20 scale-110 text-primary shadow-sm"
              : "text-on-surface-variant opacity-70 hover:opacity-100 hover:bg-white/10 hover:scale-105"
          }`}
        >
          <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: activeTab === "home" ? "'FILL' 1" : "'FILL' 0" }}>home</span>
          <span className="text-[10px] font-semibold tracking-wider">Home</span>
        </button>

        {/* Search */}
        <button
          onClick={() => setActiveTab("search")}
          className={`flex flex-col items-center group transition-all duration-300 rounded-xl p-3 w-16 ${
            activeTab === "search"
              ? "bg-white/20 scale-110 text-primary shadow-sm"
              : "text-on-surface-variant opacity-70 hover:opacity-100 hover:bg-white/10 hover:scale-105"
          }`}
        >
          <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: activeTab === "search" ? "'FILL' 1" : "'FILL' 0" }}>search</span>
          <span className="text-[10px] font-semibold tracking-wider">Search</span>
        </button>

        {/* Library */}
        <button
          onClick={() => setActiveTab("library")}
          className={`flex flex-col items-center group transition-all duration-300 rounded-xl p-3 w-16 ${
            isLibraryActive
              ? "bg-white/20 scale-110 text-primary shadow-sm"
              : "text-on-surface-variant opacity-70 hover:opacity-100 hover:bg-white/10 hover:scale-105"
          }`}
        >
          <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: isLibraryActive ? "'FILL' 1" : "'FILL' 0" }}>library_music</span>
          <span className="text-[10px] font-semibold tracking-wider">Library</span>
        </button>

        {/* Now Playing */}
        <button
          onClick={() => setActiveTab("nowplaying")}
          className={`flex flex-col items-center group transition-all duration-300 rounded-xl p-3 w-16 ${
            activeTab === "nowplaying"
              ? "bg-white/20 scale-110 text-primary shadow-sm"
              : "text-on-surface-variant opacity-70 hover:opacity-100 hover:bg-white/10 hover:scale-105"
          }`}
        >
          <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: activeTab === "nowplaying" ? "'FILL' 1" : "'FILL' 0" }}>play_circle</span>
          <span className="text-[10px] font-semibold tracking-wider">Player</span>
        </button>

        {/* Lyrics */}
        <button
          onClick={() => setActiveTab("lyrics")}
          className={`flex flex-col items-center group transition-all duration-300 rounded-xl p-3 w-16 ${
            activeTab === "lyrics"
              ? "bg-white/20 scale-110 text-primary shadow-sm"
              : "text-on-surface-variant opacity-70 hover:opacity-100 hover:bg-white/10 hover:scale-105"
          }`}
        >
          <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: activeTab === "lyrics" ? "'FILL' 1" : "'FILL' 0" }}>lyrics</span>
          <span className="text-[10px] font-semibold tracking-wider">Lyrics</span>
        </button>
      </div>
    </nav>
  );
}
