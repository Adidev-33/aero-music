import React from "react";
import { useOutletContext } from "react-router-dom";

export default function SearchView() {
  const {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    searchResults,
    isLoading,
    onSearch,
    onPlayTrack
  } = useOutletContext();
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  const getCardSubtitle = (item) => {
    const type = item.resultType || item.type || "Track";
    const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1);
    
    if (type === "song" || type === "video") {
      const artistNames = item.artists?.map(a => a.name).join(", ") || "Unknown Artist";
      const duration = item.duration || item.length || "";
      return `${artistNames} ${duration ? `• ${duration}` : ""}`;
    } else if (type === "album") {
      const artistNames = item.artists?.map(a => a.name).join(", ") || item.artist || "Unknown Artist";
      const year = item.year || "";
      return `Album • ${artistNames} ${year ? `(${year})` : ""}`;
    } else if (type === "artist") {
      return "Artist";
    } else if (type === "playlist") {
      return `Playlist • ${item.author || "YT Music"}`;
    }
    return typeCapitalized;
  };

  const getCardTitle = (item) => {
    return item.title || item.name || item.artist || "Untitled";
  };

  const getCardImage = (item) => {
    if (!item) return "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop";
    
    if (typeof item.thumbnail === "string") return item.thumbnail;
    if (typeof item.thumbnails === "string") return item.thumbnails;

    const thumbs = item.thumbnails || item.thumbnail;
    if (Array.isArray(thumbs) && thumbs.length > 0) {
      const lastThumb = thumbs[thumbs.length - 1];
      if (typeof lastThumb === "string") return lastThumb;
      if (lastThumb && typeof lastThumb.url === "string") return lastThumb.url;
    }
    return "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop";
  };

  // Extract top result (first item if unfiltered or filtered)
  const topResult = Array.isArray(searchResults) && searchResults.length > 0 ? searchResults[0] : null;
  const gridResults = Array.isArray(searchResults) ? searchResults.slice(1) : [];

  return (
    <div className="w-full">
      {/* Center Search Bar Section */}
      <div className="flex flex-col items-center mb-12 space-y-6">
        <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary text-center">
          Home
        </h2>
        <div className="w-full max-w-3xl relative group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-primary/50 group-focus-within:text-primary transition-colors">
            <span className="material-symbols-outlined text-3xl">search</span>
          </div>
          <input
            type="text"
            className="w-full bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full py-5 pl-16 pr-32 font-body-lg text-body-lg text-primary focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/10 transition-all placeholder:text-white/30 shadow-inner"
            placeholder="Artists, songs, albums, playlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="absolute inset-y-0 right-6 flex items-center gap-2">
            <button 
              onClick={onSearch}
              className="px-6 py-2 rounded-full bg-primary text-background font-semibold hover:bg-white/90 active:scale-95 transition-all text-sm"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-3 mb-10 overflow-x-auto pb-2 no-scrollbar justify-center">
        {["All", "Songs", "Artists", "Albums", "Playlists"].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-6 py-2 rounded-full glass-card text-sm font-semibold transition-all whitespace-nowrap ${
              activeFilter === filter
                ? "bg-white/20 text-primary border-white/35 scale-105"
                : "text-on-surface-variant hover:bg-white/10 hover:text-primary"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
          <p className="text-on-surface-variant text-sm animate-pulse">Retrieving live results from YouTube Music...</p>
        </div>
      )}

      {/* Results grid */}
      {!isLoading && Array.isArray(searchResults) && searchResults.length > 0 && (
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-element-gap">
          {/* Bento Top Result */}
          {topResult && (
            <div 
              onClick={() => onPlayTrack(topResult)}
              className="col-span-2 row-span-2 glass-card rounded-lg p-panel-padding flex flex-col justify-end relative group overflow-hidden min-h-[350px] cursor-pointer"
            >
              <div className="absolute inset-0 z-0">
                <img
                  src={getCardImage(topResult)}
                  alt={getCardTitle(topResult)}
                  className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700 rounded-lg"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
              </div>
              <div className="relative z-10">
                <span className="font-label-sm text-primary mb-2 inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] uppercase tracking-wider">
                  Top Result
                </span>
                <h3 className="font-display-lg text-primary text-display-lg-mobile md:text-headline-md mb-1 line-clamp-2">
                  {getCardTitle(topResult)}
                </h3>
                <p className="text-on-surface-variant text-sm font-medium">
                  {getCardSubtitle(topResult)}
                </p>
              </div>
              {/* Play button */}
              <button
                onClick={(e) => { e.stopPropagation(); onPlayTrack(topResult); }}
                className="absolute bottom-panel-padding right-panel-padding w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 glow-button shadow-2xl z-20"
              >
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  play_arrow
                </span>
              </button>
            </div>
          )}

          {/* Grid results */}
          {gridResults.map((item, idx) => (
            <div
              key={idx}
              onClick={() => onPlayTrack(item)}
              className="glass-card rounded-lg p-unit flex flex-col group relative overflow-hidden cursor-pointer"
            >
              <div className="aspect-square rounded-[24px] overflow-hidden mb-4 relative">
                <img
                  src={getCardImage(item)}
                  alt={getCardTitle(item)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-[24px]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={(e) => { e.stopPropagation(); onPlayTrack(item); }}
                    className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center glow-button hover:scale-110 transition-transform"
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      play_arrow
                    </span>
                  </button>
                </div>
              </div>
              <div className="px-2 pb-2">
                <h4 className="font-semibold text-sm text-primary truncate">
                  {getCardTitle(item)}
                </h4>
                <p className="text-xs text-on-surface-variant truncate mt-1">
                  {getCardSubtitle(item)}
                </p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* No query / initial view */}
      {!isLoading && (!searchResults || searchResults.length === 0) && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="material-symbols-outlined text-6xl text-white/20 mb-4 animate-bounce">music_note</span>
          <p className="text-on-surface-variant font-medium">Search for your favorite songs, artists, or albums.</p>
          <p className="text-xs text-white/30 mt-2">All playback and metadata are streamed live from YouTube Music.</p>
        </div>
      )}
    </div>
  );
}
