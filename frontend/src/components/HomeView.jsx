import React, { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";

export default function HomeView() {
  const {
    recentlyPlayed = [],
    onPlayTrack
  } = useOutletContext();
  
  const navigate = useNavigate();
  const [chillPicks, setChillPicks] = useState([]);
  const [picksLoading, setPicksLoading] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Calculate dynamic greeting based on hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Fetch some nice chill picks on mount for landing page content + SHUFFLE them!
  useEffect(() => {
    const fetchChillPicks = async () => {
      setPicksLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/search?q=lofi%20chill%20beats&filter=All`);
        const data = await res.json();
        
        let shuffled = Array.isArray(data) ? [...data] : [];
        // Durstenfeld shuffle algorithm
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setChillPicks(shuffled.slice(0, 5));
      } catch (err) {
        console.error("Failed to load chill picks:", err);
      } finally {
        setPicksLoading(false);
      }
    };
    
    fetchChillPicks();
  }, [API_BASE]);

  // Fetch location and trending songs — location resolved server-side (no CORS issues)
  useEffect(() => {
    const fetchLocationAndTrending = async () => {
      setTrendingLoading(true);
      try {
        const trendRes = await fetch(`${API_BASE}/api/trending`);
        const trendData = await trendRes.json();
        if (trendData.location) {
          setLocationName(trendData.location);
        }
        setTrendingSongs(Array.isArray(trendData.tracks) ? trendData.tracks.slice(0, 5) : []);
      } catch (trendErr) {
        console.error("Trending fetch failed:", trendErr);
      } finally {
        setTrendingLoading(false);
      }
    };
    fetchLocationAndTrending();
  }, [API_BASE]);

  const getTrackImage = (item) => {
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

  const getTrackSubtitle = (item) => {
    const type = item.resultType || item.type || "Track";
    if (type === "song" || type === "video" || !item.resultType) {
      return item.artists?.map(a => a.name).join(", ") || item.artist || "Unknown Artist";
    }
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="w-full text-left space-y-12">
      {/* Dynamic Welcoming Greeting Area */}
      <div className="glass-panel rounded-2xl p-8 border border-white/5 bg-gradient-to-tr from-purple-900/20 via-surface-variant/5 to-transparent relative overflow-hidden shadow-2xl">
        <div className="absolute -inset-10 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="relative z-10">
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-secondary">Welcome</span>
          <h1 className="font-display-lg text-primary text-3xl md:text-5xl mt-1 mb-2 tracking-tight">
            {getGreeting()}, Listener
          </h1>
          <p className="text-on-surface-variant text-sm max-w-md opacity-85">
            Stream, discover, and organize your favorite songs with Aero Music's spatial audio engine.
          </p>
          
          <button
            onClick={() => navigate("/search")}
            className="mt-6 px-6 py-2.5 rounded-full bg-white/10 border border-white/15 text-primary text-xs font-semibold hover:bg-white/20 active:scale-95 transition-all flex items-center gap-1.5 w-fit"
          >
            <span className="material-symbols-outlined text-[16px]">search</span>
            Search Music
          </button>
        </div>
      </div>

      {/* Recently Played Section (Exactly last 5 tracks) */}
      {recentlyPlayed && recentlyPlayed.length > 0 && (
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-headline-md text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">history</span>
              Recently Played
            </h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-element-gap">
            {recentlyPlayed.slice(0, 5).map((track, idx) => (
              <div
                key={idx}
                onClick={() => onPlayTrack(track)}
                className="glass-card rounded-lg p-unit flex flex-col group relative overflow-hidden cursor-pointer"
              >
                <div className="aspect-square rounded-[24px] overflow-hidden mb-3 relative">
                  <img
                    src={getTrackImage(track)}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-[24px]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => { e.stopPropagation(); onPlayTrack(track); }}
                      className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center glow-button hover:scale-110 transition-transform"
                    >
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        play_arrow
                      </span>
                    </button>
                  </div>
                </div>
                <div className="px-2 pb-2">
                  <h4 className="font-semibold text-xs text-primary truncate">
                    {track.title}
                  </h4>
                  <p className="text-[10px] text-on-surface-variant truncate mt-0.5">
                    {getTrackSubtitle(track)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trending songs by Location */}
      <section className="space-y-6">
        <div>
          <h2 className="font-bold text-headline-md text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">trending_up</span>
            Trending in {locationName || "Your Area"}
          </h2>
          <p className="text-on-surface-variant text-xs opacity-60">
            Top hits matching what listeners are streaming locally right now
          </p>
        </div>

        {trendingLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-element-gap">
            {trendingSongs.map((track, idx) => (
              <div
                key={idx}
                onClick={() => onPlayTrack(track)}
                className="glass-card rounded-lg p-unit flex flex-col group relative overflow-hidden cursor-pointer"
              >
                <div className="aspect-square rounded-[24px] overflow-hidden mb-3 relative">
                  <img
                    src={getTrackImage(track)}
                    alt={track.title || track.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-[24px]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => { e.stopPropagation(); onPlayTrack(track); }}
                      className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center glow-button hover:scale-110 transition-transform"
                    >
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        play_arrow
                      </span>
                    </button>
                  </div>
                </div>
                <div className="px-2 pb-2">
                  <h4 className="font-semibold text-xs text-primary truncate">
                    {track.title || track.name}
                  </h4>
                  <p className="text-[10px] text-on-surface-variant truncate mt-0.5">
                    {getTrackSubtitle(track)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Curated Recommendations (Chill picks - shuffled!) */}
      <section className="space-y-6">
        <div>
          <h2 className="font-bold text-headline-md text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">recommend</span>
            Chill Picks
          </h2>
          <p className="text-on-surface-variant text-xs opacity-60">Handpicked lofi and chill beats (randomized each load)</p>
        </div>

        {picksLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-element-gap">
            {chillPicks.map((track, idx) => (
              <div
                key={idx}
                onClick={() => onPlayTrack(track)}
                className="glass-card rounded-lg p-unit flex flex-col group relative overflow-hidden cursor-pointer"
              >
                <div className="aspect-square rounded-[24px] overflow-hidden mb-3 relative">
                  <img
                    src={getTrackImage(track)}
                    alt={track.title || track.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-[24px]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => { e.stopPropagation(); onPlayTrack(track); }}
                      className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center glow-button hover:scale-110 transition-transform"
                    >
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        play_arrow
                      </span>
                    </button>
                  </div>
                </div>
                <div className="px-2 pb-2">
                  <h4 className="font-semibold text-xs text-primary truncate">
                    {track.title || track.name}
                  </h4>
                  <p className="text-[10px] text-on-surface-variant truncate mt-0.5">
                    {getTrackSubtitle(track)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
