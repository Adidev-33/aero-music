import React from "react";

function formatTime(secs) {
  if (isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

import { useOutletContext } from "react-router-dom";

export default function NowPlayingView() {
  const {
    currentTrack,
    queue,
    onPlayTrack,
    onPlayFromQueue,
    lyricsSnippet,
    setActiveTab,
    isPlaying,
    currentTime,
    duration,
    isLiked,
    onPlayPause,
    onNext,
    onPrev,
    onSeek,
    onToggleLike,
    shuffle,
    repeatMode,
    onToggleShuffle,
    onToggleRepeat
  } = useOutletContext();
  const getTrackSubtitle = (track) => {
    try {
      if (!track) return "";
      if (Array.isArray(track.artists)) {
        return track.artists.map(a => a.name).join(", ");
      }
      if (typeof track.artists === "string") return track.artists;
      return track.artist || "Unknown Artist";
    } catch (e) {
      console.error("Error in getTrackSubtitle:", e);
      return "Unknown Artist";
    }
  };

  const getTrackImage = (track) => {
    try {
      if (!track) return "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop";
      if (typeof track.thumbnail === "string") return track.thumbnail;
      if (typeof track.thumbnails === "string") return track.thumbnails;
      const thumbs = track.thumbnails || track.thumbnail;
      if (Array.isArray(thumbs) && thumbs.length > 0) {
        const last = thumbs[thumbs.length - 1];
        if (typeof last === "string") return last;
        if (last && typeof last === "object" && last.url) return last.url;
      }
    } catch (e) {
      console.error("Error in getTrackImage:", e);
    }
    return "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop";
  };

  const [isDragging, setIsDragging] = React.useState(false);
  const [dragValue, setDragValue] = React.useState(0);

  const displayTime = isDragging ? dragValue : currentTime;
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  // Up Next: all tracks after the current one in the queue
  const currentQueueIndex = queue?.findIndex(t => t.videoId === currentTrack?.videoId) ?? -1;
  const upNextTracks = currentQueueIndex >= 0
    ? (queue?.slice(currentQueueIndex + 1) || [])
    : (queue?.filter(t => t.videoId !== currentTrack?.videoId) || []);

  return (
    <div className="flex w-full h-full max-w-[1400px] mx-auto overflow-hidden gap-6">
      {/* Centerpiece: Album Art */}
      <section className="flex-1 hidden lg:flex flex-col items-center justify-center py-6 min-w-0">
        {currentTrack ? (
          <>
            {/* Album Container */}
            <div className="relative w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] md:w-[380px] md:h-[380px] lg:w-[400px] lg:h-[400px] glass-panel rounded-lg p-5 shadow-2xl transition-transform duration-700 hover:scale-[1.02]">
              <div className="w-full h-full rounded overflow-hidden relative shadow-[0_0_80px_rgba(255,255,255,0.05)]">
                <img
                  src={getTrackImage(currentTrack)}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
                {/* Reflection Flare */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                
                {/* Overlay details */}
                <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col items-start text-left">
                  <span className="font-label-sm text-label-sm text-primary/60 tracking-[0.2em] uppercase mb-1 text-[10px]">
                    Currently Streaming
                  </span>
                  <h2 className="font-display-lg text-primary text-xl sm:text-2xl md:text-3xl mb-1 line-clamp-1">
                    {currentTrack.title}
                  </h2>
                  <p className="font-body-lg text-primary/75 text-xs md:text-sm line-clamp-1">
                    {getTrackSubtitle(currentTrack)} {currentTrack.album?.name ? `• ${currentTrack.album.name}` : ""}
                  </p>
                </div>
              </div>
            </div>

          {/* Mobile Playback Controller - shown only on mobile (section is hidden on mobile anyway) */}
          <div className="flex lg:hidden flex-col items-center gap-4 w-full max-w-[300px] sm:max-w-[400px] mt-10 px-2">
            {/* Seekbar */}
            <div className="w-full flex items-center gap-3">
              <span className="text-[10px] text-on-surface-variant w-8 text-right">
                {formatTime(displayTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={displayTime}
                onMouseDown={() => {
                  setIsDragging(true);
                  setDragValue(currentTime);
                }}
                onTouchStart={() => {
                  setIsDragging(true);
                  setDragValue(currentTime);
                }}
                onChange={(e) => {
                  setDragValue(Number(e.target.value));
                }}
                onMouseUp={() => {
                  setIsDragging(false);
                  onSeek(dragValue);
                }}
                onTouchEnd={() => {
                  setIsDragging(false);
                  onSeek(dragValue);
                }}
                className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary focus:outline-none"
                style={{
                  background: `linear-gradient(to right, #ffffff 0%, #ffffff ${progressPercent}%, rgba(255, 255, 255, 0.1) ${progressPercent}%, rgba(255, 255, 255, 0.1) 100%)`
                }}
              />
              <span className="text-[10px] text-on-surface-variant w-8">
                {formatTime(duration)}
              </span>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between mt-2 w-full px-2 gap-2">
              <button 
                onClick={onToggleLike} 
                className={`text-xl transition-all active:scale-95 flex items-center justify-center ${isLiked ? "text-red-500 scale-110" : "text-on-surface-variant hover:text-primary"}`}
              >
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>
                  favorite
                </span>
              </button>
              
              <button 
                onClick={onToggleShuffle} 
                className={`text-xl transition-all active:scale-95 flex items-center justify-center ${shuffle ? "text-secondary font-bold" : "text-on-surface-variant hover:text-primary"}`}
                title="Shuffle"
              >
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: shuffle ? "'FILL' 1" : "'FILL' 0" }}>
                  shuffle
                </span>
              </button>

              <button 
                onClick={onPrev} 
                className="text-primary text-2xl cursor-pointer hover:scale-110 active:scale-90 transition-all flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[30px]">skip_previous</span>
              </button>
              
              <button
                onClick={onPlayPause}
                className="w-12 h-12 rounded-full bg-primary text-background flex items-center justify-center cursor-pointer hover:scale-105 active:scale-90 transition-all shadow-lg shadow-primary/20 flex-shrink-0"
              >
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isPlaying ? "pause" : "play_arrow"}
                </span>
              </button>
              
              <button 
                onClick={onNext} 
                className="text-primary text-2xl cursor-pointer hover:scale-110 active:scale-90 transition-all flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[30px]">skip_next</span>
              </button>

              <button 
                onClick={onToggleRepeat} 
                className={`text-xl transition-all active:scale-95 flex items-center justify-center ${repeatMode !== "none" ? "text-secondary font-bold" : "text-on-surface-variant hover:text-primary"}`}
                title={`Repeat: ${repeatMode}`}
              >
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: repeatMode !== "none" ? "'FILL' 1" : "'FILL' 0" }}>
                  {repeatMode === "one" ? "repeat_one" : "repeat"}
                </span>
              </button>

              <button 
                onClick={() => setActiveTab("lyrics")} 
                className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center w-8 h-8"
              >
                <span className="material-symbols-outlined text-[24px]">lyrics</span>
              </button>
            </div>
          </div>
      </>
    ) : (
          <div className="flex flex-col items-center justify-center p-8 sm:p-12 glass-panel rounded-lg w-[320px] h-[320px] max-h-full">
            <span className="material-symbols-outlined text-5xl text-white/20 mb-4 animate-pulse">music_note</span>
            <p className="text-on-surface-variant text-center text-sm">No track is currently playing. Search and select a track to begin.</p>
          </div>
        )}
      </section>

      <aside className="w-full lg:w-[420px] flex-shrink-0 h-full flex flex-col py-2">
        <div className="glass-panel rounded-lg p-panel-padding flex flex-col gap-element-gap border border-white/5 h-full overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center mb-2 flex-shrink-0">
            <h3 className="font-semibold text-lg md:text-xl text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">queue_music</span>
              Up Next
            </h3>
          </div>

          {/* Queue List */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 no-scrollbar">
            {upNextTracks.length > 0 ? (
              upNextTracks.map((track, idx) => (
                <div
                  key={idx}
                  onClick={() => onPlayFromQueue(track)}
                  className="flex items-center gap-4 p-2.5 rounded hover:bg-white/5 transition-all group cursor-pointer border border-transparent hover:border-white/5"
                >
                  <div className="w-12 h-12 rounded overflow-hidden glass-card flex-shrink-0 relative">
                    <img
                      src={getTrackImage(track)}
                      alt={track.title}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300 rounded"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-primary text-xl">play_arrow</span>
                    </div>
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-semibold text-sm text-primary group-hover:text-secondary transition-colors truncate">
                      {track.title}
                    </h4>
                    <p className="text-xs text-on-surface-variant truncate">
                      {getTrackSubtitle(track)}
                    </p>
                  </div>
                  <span className="text-xs text-on-surface-variant flex-shrink-0">
                    {track.length || track.duration || ""}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center text-white/30">
                <span className="material-symbols-outlined text-3xl mb-2">autoplay</span>
                <p className="text-xs">No upcoming tracks. Start playing a song to generate a queue.</p>
              </div>
            )}
          </div>

          {/* Lyrics Snippet */}
          {lyricsSnippet && (
            <div 
              onClick={() => setActiveTab("lyrics")}
              className="mt-auto pt-4 border-t border-white/5 cursor-pointer group"
            >
              <div className="glass-card p-4 rounded-lg bg-primary/5 hover:bg-white/10 transition-colors border border-white/5">
                <span className="text-[10px] font-semibold text-primary/40 uppercase tracking-widest block mb-2">
                  Lyrics Preview
                </span>
                <p className="font-body-lg text-primary/80 italic leading-relaxed text-sm line-clamp-3">
                  "{lyricsSnippet}"
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
