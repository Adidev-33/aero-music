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
    onToggleLike
  } = useOutletContext();
  const getTrackSubtitle = (track) => {
    if (!track) return "";
    if (track.artists) {
      return track.artists.map(a => a.name).join(", ");
    }
    return track.artist || "Unknown Artist";
  };

  const getTrackImage = (track) => {
    if (track?.thumbnail && track.thumbnail.length > 0) {
      return track.thumbnail[track.thumbnail.length - 1].url;
    }
    if (track?.thumbnails && track.thumbnails.length > 0) {
      return track.thumbnails[track.thumbnails.length - 1].url;
    }
    return "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop";
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newPercentage = Math.max(0, Math.min(1, clickX / width));
    onSeek(newPercentage * duration);
  };

  // Up Next: all tracks after the current one in the queue
  const currentQueueIndex = queue?.findIndex(t => t.videoId === currentTrack?.videoId) ?? -1;
  const upNextTracks = currentQueueIndex >= 0
    ? (queue?.slice(currentQueueIndex + 1) || [])
    : (queue?.filter(t => t.videoId !== currentTrack?.videoId) || []);

  return (
    <div className="grid grid-cols-12 gap-gutter max-w-[1400px] mx-auto items-center min-h-[calc(100vh-250px)] pt-6 md:pt-0">
      {/* Centerpiece: Album Art */}
      <section className="col-span-12 lg:col-span-7 flex flex-col items-center justify-center py-6">
        {currentTrack ? (
          <>
            <div className="relative group animate-float">
            {/* Grounding Shadow */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[80%] h-12 bg-black/50 blur-[50px] rounded-full opacity-60"></div>
            
            {/* Album Container */}
            <div className="relative w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[450px] md:h-[450px] glass-panel rounded-lg p-5 shadow-2xl transition-transform duration-700 hover:scale-[1.02]">
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
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col items-start text-left">
                  <span className="font-label-sm text-label-sm text-primary/60 tracking-[0.2em] uppercase mb-1 md:mb-2 text-[10px]">
                    Currently Streaming
                  </span>
                  <h2 className="font-display-lg text-primary text-2xl sm:text-3xl md:text-4xl mb-1 line-clamp-1">
                    {currentTrack.title}
                  </h2>
                  <p className="font-body-lg text-primary/75 text-sm md:text-base line-clamp-1">
                    {getTrackSubtitle(currentTrack)} {currentTrack.album?.name ? `• ${currentTrack.album.name}` : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Playback Controller */}
          <div className="flex lg:hidden flex-col items-center gap-4 w-full max-w-[300px] sm:max-w-[400px] mt-10 px-2">
            {/* Seekbar */}
            <div className="w-full flex items-center gap-3">
              <span className="text-[10px] text-on-surface-variant w-8 text-right">
                {formatTime(currentTime)}
              </span>
              <div
                onClick={handleProgressClick}
                className="flex-1 h-1.5 bg-white/10 rounded-full relative group cursor-pointer"
              >
                <div
                  className="absolute inset-y-0 left-0 bg-primary rounded-full"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full opacity-100 shadow-[0_0_10px_white]"></div>
                </div>
              </div>
              <span className="text-[10px] text-on-surface-variant w-8">
                {formatTime(duration)}
              </span>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-8 mt-2 w-full">
              <button 
                onClick={onToggleLike} 
                className={`text-xl transition-all active:scale-95 flex items-center justify-center ${isLiked ? "text-red-500 scale-110" : "text-on-surface-variant hover:text-primary"}`}
              >
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>
                  favorite
                </span>
              </button>
              <button 
                onClick={onPrev} 
                className="text-primary text-3xl cursor-pointer hover:scale-110 active:scale-90 transition-all flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[36px]">skip_previous</span>
              </button>
              <button
                onClick={onPlayPause}
                className="w-14 h-14 rounded-full bg-primary text-background flex items-center justify-center cursor-pointer hover:scale-105 active:scale-90 transition-all shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isPlaying ? "pause" : "play_arrow"}
                </span>
              </button>
              <button 
                onClick={onNext} 
                className="text-primary text-3xl cursor-pointer hover:scale-110 active:scale-90 transition-all flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[36px]">skip_next</span>
              </button>
              <button 
                onClick={() => setActiveTab("lyrics")} 
                className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center w-8 h-8"
              >
                <span className="material-symbols-outlined text-2xl">lyrics</span>
              </button>
            </div>
          </div>
      </>
    ) : (
          <div className="flex flex-col items-center justify-center p-20 glass-panel rounded-lg w-[350px] h-[350px]">
            <span className="material-symbols-outlined text-6xl text-white/20 mb-4 animate-pulse">music_note</span>
            <p className="text-on-surface-variant text-center">No track is currently playing. Search and select a track to begin.</p>
          </div>
        )}
      </section>

      {/* Sidebar: Up Next Queue & Lyrics Preview */}
      <aside className="col-span-12 lg:col-span-5 h-full flex flex-col justify-between py-6">
        <div className="glass-panel rounded-lg p-panel-padding flex flex-col gap-element-gap border border-white/5 h-full justify-between min-h-[480px]">
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-xl text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">queue_music</span>
              Up Next
            </h3>
            <button 
              onClick={() => setActiveTab("lyrics")}
              className="text-xs font-semibold text-secondary hover:text-primary transition-colors uppercase tracking-wider"
            >
              Lyrics View
            </button>
          </div>

          {/* Queue List */}
          <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-3 no-scrollbar">
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
              className="mt-6 pt-4 border-t border-white/5 cursor-pointer group"
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
