import React, { useEffect, useRef, useCallback } from "react";
import { useOutletContext } from "react-router-dom";

export default function LyricsView() {
  const {
    currentTrack,
    lyrics,
    lyricsLoading,
    currentTime,
    duration,
    isLiked,
    onToggleLike
  } = useOutletContext();

  const containerRef = useRef(null);
  const lineRefs = useRef([]);

  // Parse timestamped lyrics if available
  const parsedLines = React.useMemo(() => {
    if (!lyrics) return [];
    
    const rawLines = lyrics.split("\n");
    const parsed = [];
    const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;
    
    for (const line of rawLines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;
      
      const times = [];
      let match;
      timeRegex.lastIndex = 0;
      
      while ((match = timeRegex.exec(cleanLine)) !== null) {
        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        const ms = match[3] ? parseInt(match[3], 10) : 0;
        const timeInSeconds = mins * 60 + secs + (match[3] && match[3].length === 3 ? ms / 1000 : ms / 100);
        times.push(timeInSeconds);
      }
      
      const text = cleanLine.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, "").trim();
      
      if (times.length > 0) {
        for (const t of times) {
          parsed.push({ time: t, text });
        }
      } else {
        parsed.push({ time: null, text: cleanLine });
      }
    }
    
    parsed.sort((a, b) => {
      if (a.time === null) return 1;
      if (b.time === null) return -1;
      return a.time - b.time;
    });
    
    return parsed;
  }, [lyrics]);

  const hasTimestamps = parsedLines.length > 0 && parsedLines.some(l => l.time !== null);

  const activeIndex = React.useMemo(() => {
    if (parsedLines.length === 0) return -1;

    if (hasTimestamps && currentTime != null) {
      // Find the last line whose timestamp is <= currentTime
      let best = -1;
      for (let i = 0; i < parsedLines.length; i++) {
        const t = parsedLines[i].time;
        if (t !== null && currentTime >= t) {
          best = i;
        } else if (t !== null && currentTime < t) {
          break; // lines are sorted ascending, no need to continue
        }
      }
      return best;
    }

    // Fallback: position-based estimate for plain lyrics
    if (duration > 0 && currentTime != null) {
      return Math.min(
        parsedLines.length - 1,
        Math.floor((currentTime / duration) * parsedLines.length)
      );
    }

    return -1;
  }, [currentTime, duration, parsedLines, hasTimestamps]);

  // Scroll active line to center of container
  const scrollToActive = useCallback((index) => {
    const container = containerRef.current;
    const lineEl = lineRefs.current[index];
    if (!container || !lineEl) return;

    const containerHeight = container.clientHeight;
    const lineTop = lineEl.offsetTop;
    const lineHeight = lineEl.offsetHeight;

    // Target scroll: put the active line's center at container center
    const targetScroll = lineTop - containerHeight / 2 + lineHeight / 2;
    container.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (activeIndex >= 0) {
      scrollToActive(activeIndex);
    }
  }, [activeIndex, scrollToActive]);

  const getTrackImage = (item) => {
    if (!item) return "";
    if (typeof item.thumbnail === "string") return item.thumbnail;
    if (typeof item.thumbnails === "string") return item.thumbnails;
    const thumbs = item.thumbnails || item.thumbnail;
    if (Array.isArray(thumbs) && thumbs.length > 0) {
      const last = thumbs[thumbs.length - 1];
      if (typeof last === "string") return last;
      if (last?.url) return last.url;
    }
    return "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop";
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full items-center justify-center gap-12 lg:gap-16 max-w-[1400px] mx-auto py-4 overflow-hidden">
      {/* Left: Album Art Section (Desktop only) */}
      <section className="hidden lg:flex flex-1 flex-col items-center justify-center max-w-md w-full">
        {currentTrack ? (
          <>
            <div className="relative group w-full aspect-square max-w-[360px] md:max-w-[400px]">
              <div className="absolute -inset-4 bg-white/5 blur-2xl rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="w-full h-full rounded-lg overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)] border border-white/10 relative transition-transform duration-700 hover:scale-[1.02]">
                <img
                  src={getTrackImage(currentTrack)}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
              </div>
            </div>
            {/* Song Info */}
            <div className="w-full mt-8 flex justify-between items-end max-w-[360px] md:max-w-[400px] text-left">
              <div className="space-y-1 overflow-hidden pr-4">
                <h1 className="font-display-lg text-primary text-2xl md:text-3xl tracking-tight truncate">
                  {currentTrack.title}
                </h1>
                <p className="font-semibold text-on-surface-variant opacity-80 text-sm md:text-base truncate">
                  {currentTrack.artists?.map(a => a.name).join(", ") || "Unknown Artist"}
                </p>
              </div>
              <button
                onClick={onToggleLike}
                className={`w-12 h-12 flex-shrink-0 rounded-full glass-panel flex items-center justify-center transition-all ${
                  isLiked ? "text-red-500 bg-white/5" : "text-primary hover:bg-white/25"
                }`}
              >
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>
                  favorite
                </span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 glass-panel rounded-lg w-[320px] h-[320px]">
            <span className="material-symbols-outlined text-6xl text-white/20 mb-4 animate-pulse">lyrics</span>
            <p className="text-on-surface-variant text-center">No track playing.</p>
          </div>
        )}
      </section>

      {/* Right: Lyrics Scrolling Panel */}
      <section className="flex-1 w-full h-full max-w-xl glass-panel rounded-lg p-panel-padding relative flex flex-col specular-highlight border border-white/5 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <span className="font-semibold text-[10px] uppercase tracking-widest text-secondary">
            Lyrics
          </span>
        </div>

        {/* Mobile Header */}
        {currentTrack && (
          <div className="flex lg:hidden items-center gap-4 mb-6 pb-4 border-b border-white/10 w-full text-left flex-shrink-0">
            <img
              src={getTrackImage(currentTrack)}
              alt={currentTrack.title}
              className="w-12 h-12 rounded object-cover flex-shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="flex-grow min-w-0">
              <h2 className="font-bold text-sm text-primary truncate">{currentTrack.title}</h2>
              <p className="text-xs text-on-surface-variant truncate">
                {currentTrack.artists?.map(a => a.name).join(", ") || "Unknown Artist"}
              </p>
            </div>
            <button
              onClick={onToggleLike}
              className={`text-xl flex-shrink-0 ${isLiked ? "text-red-500" : "text-on-surface-variant"}`}
            >
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>
                favorite
              </span>
            </button>
          </div>
        )}

        {/* Scrolling Lyrics Container — overflow-hidden on panel, scroll inside */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto no-scrollbar relative"
          id="lyrics-container"
          style={{
            maskImage: "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
          }}
        >
          {lyricsLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3 py-20">
              <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
              <p className="text-xs text-on-surface-variant">Fetching lyrics...</p>
            </div>
          ) : parsedLines.length > 0 ? (
            <div className="py-[40%] space-y-6 px-2">
              {parsedLines.map((line, index) => {
                const isActive = index === activeIndex;
                return (
                  <p
                    key={index}
                    ref={(el) => { lineRefs.current[index] = el; }}
                    className={`lyric-line text-lg md:text-2xl leading-relaxed text-left transition-all duration-500 ${
                      isActive
                        ? "text-white font-bold opacity-100 scale-[1.04] origin-left pl-4"
                        : "text-white/30 font-semibold opacity-50 blur-[0.5px]"
                    }`}
                    style={{
                      transform: isActive ? "scale(1.04)" : "scale(1)",
                      transformOrigin: "left center",
                      filter: isActive ? "blur(0)" : "blur(0.6px)",
                    }}
                  >
                    {line.text}
                  </p>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-white/30 py-20">
              <span className="material-symbols-outlined text-4xl mb-2 text-white/20">search_off</span>
              <p className="text-sm">Lyrics not available for this song.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
