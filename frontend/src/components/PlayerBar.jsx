import React from "react";

function formatTime(secs) {
  if (isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

const getTrackImage = (item) => {
  if (!item) return "";
  if (typeof item.thumbnail === "string") return item.thumbnail;
  if (typeof item.thumbnails === "string") return item.thumbnails;

  const thumbs = item.thumbnails || item.thumbnail;
  if (Array.isArray(thumbs) && thumbs.length > 0) {
    const lastThumb = thumbs[thumbs.length - 1];
    if (typeof lastThumb === "string") return lastThumb;
    if (lastThumb && typeof lastThumb.url === "string") return lastThumb.url;
  }
  return "";
};

export default function PlayerBar({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  shuffle,
  repeat,
  isLiked,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleLike,
  activeTab,
  setActiveTab
}) {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newPercentage = Math.max(0, Math.min(1, clickX / width));
    onSeek(newPercentage * duration);
  };

  const trackImageUrl = getTrackImage(currentTrack);

  return (
    <footer className="fixed bottom-[76px] md:bottom-8 left-1/2 -translate-x-1/2 w-[92%] md:w-[90%] max-w-5xl rounded-lg bg-surface-container/80 md:bg-surface-container/60 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] z-50 flex items-center justify-between px-4 md:px-panel-padding h-16 md:h-24 shadow-2xl transition-all overflow-hidden">
      {/* Top progress line for mobile mini-player */}
      <div 
        className="absolute top-0 left-0 h-[2.5px] bg-primary transition-all md:hidden"
        style={{ width: `${progressPercent}%` }}
      ></div>

      {/* Left: Track Details */}
      <div className="flex items-center gap-3 md:gap-4 w-2/3 md:w-1/4 min-w-[150px] md:min-w-[200px]">
        <div 
          onClick={() => setActiveTab("nowplaying")}
          className="w-10 h-10 md:w-14 md:h-14 rounded overflow-hidden shadow-lg border border-white/10 cursor-pointer flex-shrink-0"
        >
          {trackImageUrl ? (
            <img
              src={trackImageUrl}
              alt={currentTrack?.title || "Album Art"}
              className="w-full h-full object-cover rounded"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary/40 text-lg md:text-2xl">music_note</span>
            </div>
          )}
        </div>
        <div className="overflow-hidden flex-grow max-w-[120px] sm:max-w-[150px] text-left">
          <h5 
            onClick={() => setActiveTab("nowplaying")}
            className="font-bold text-xs md:text-body-md text-primary truncate cursor-pointer hover:underline"
          >
            {currentTrack?.title || "Not Playing"}
          </h5>
          <p className="font-label-sm text-[10px] md:text-xs text-on-surface-variant truncate">
            {currentTrack?.artists?.map((a) => a.name).join(", ") || "Unknown Artist"}
          </p>
        </div>
        {currentTrack && (
          <button 
            onClick={onToggleLike}
            className={`hidden sm:block transition-colors duration-200 ${isLiked ? "text-red-500 scale-110" : "text-on-surface-variant hover:text-primary"}`}
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>
              favorite
            </span>
          </button>
        )}
      </div>

      {/* Center: Controls & Seek (Desktop only) */}
      <div className="hidden md:flex flex-col items-center gap-2 flex-1 max-w-md">
        <div className="flex items-center gap-6">
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-xl">shuffle</span>
          </button>
          <button 
            onClick={onPrev}
            className="text-primary text-3xl cursor-pointer hover:scale-110 transition-transform"
          >
            <span className="material-symbols-outlined">skip_previous</span>
          </button>
          
          <button
            onClick={onPlayPause}
            className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg glow-button"
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isPlaying ? "pause" : "play_arrow"}
            </span>
          </button>

          <button 
            onClick={onNext}
            className="text-primary text-3xl cursor-pointer hover:scale-110 transition-transform"
          >
            <span className="material-symbols-outlined">skip_next</span>
          </button>
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-xl">repeat</span>
          </button>
        </div>

        {/* Seekbar */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[10px] text-on-surface-variant w-8 text-right">
            {formatTime(currentTime)}
          </span>
          <div
            onClick={handleProgressClick}
            className="flex-1 h-1 bg-white/10 rounded-full relative group cursor-pointer"
          >
            <div
              className="absolute inset-y-0 left-0 bg-primary rounded-full"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_white]"></div>
            </div>
          </div>
          <span className="text-[10px] text-on-surface-variant w-8">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right: Volume & Shortcuts (Desktop only) */}
      <div className="hidden md:flex items-center justify-end gap-4 w-1/4 min-w-[150px]">
        <div className="flex items-center gap-2 group/volume">
          <span className="material-symbols-outlined text-on-surface-variant text-xl">
            {volume === 0 ? "volume_off" : volume < 50 ? "volume_down" : "volume_up"}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="w-20 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary focus:outline-none"
            style={{
              background: `linear-gradient(to right, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.6) ${volume}%, rgba(255, 255, 255, 0.1) ${volume}%, rgba(255, 255, 255, 0.1) 100%)`
            }}
          />
        </div>

        <div className="flex items-center gap-3 border-l border-white/10 pl-4">
          <button
            onClick={() => setActiveTab(activeTab === "lyrics" ? "nowplaying" : "lyrics")}
            className={`transition-colors ${activeTab === "lyrics" ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}
            title="Lyrics"
          >
            <span className="material-symbols-outlined text-xl">lyrics</span>
          </button>
          <button
            onClick={() => setActiveTab(activeTab === "nowplaying" ? "search" : "nowplaying")}
            className={`transition-colors ${activeTab === "nowplaying" ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}
            title="Now Playing"
          >
            <span className="material-symbols-outlined text-xl">expand_less</span>
          </button>
        </div>
      </div>

      {/* Mobile Action Controls Group */}
      <div className="flex md:hidden items-center gap-3.5 z-10 pr-2">
        <button
          onClick={onPlayPause}
          className="w-9 h-9 rounded-full bg-primary text-background flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
        >
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
            {isPlaying ? "pause" : "play_arrow"}
          </span>
        </button>
        <button 
          onClick={onNext}
          className="text-primary flex items-center justify-center hover:scale-110 transition-transform"
        >
          <span className="material-symbols-outlined text-2xl">skip_next</span>
        </button>
      </div>
    </footer>
  );
}
