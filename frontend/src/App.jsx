import React, { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import SideNavBar from "./components/SideNavBar";
import PlayerBar from "./components/PlayerBar";
import BottomNavBar from "./components/BottomNavBar";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.replace(/^\//, "") || "home";
  const setActiveTab = (tab) => navigate(`/${tab}`);
  const isHome = activeTab === "home" || activeTab === "";
  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Lyrics states
  const [lyrics, setLyrics] = useState("");
  const [lyricsSnippet, setLyricsSnippet] = useState("");
  const [lyricsLoading, setLyricsLoading] = useState(false);

  // Player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);

  // Library states
  const [likedSongs, setLikedSongs] = useState(() => {
    const saved = localStorage.getItem("yt_liked_songs");
    return saved ? JSON.parse(saved) : [];
  });
  const [recentlyPlayed, setRecentlyPlayed] = useState(() => {
    const saved = localStorage.getItem("yt_recent_played");
    return saved ? JSON.parse(saved) : [];
  });
  const [playlists, setPlaylists] = useState(() => {
    const saved = localStorage.getItem("yt_playlists");
    return saved ? JSON.parse(saved) : [];
  });

  const playerRef = useRef(null);
  // Ref so the YT player's onStateChange closure always has the latest playNext
  const playNextRef = useRef(null);

  // Initialize YouTube IFrame Player
  useEffect(() => {
    const checkYT = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(checkYT);
        initializePlayer();
      }
    }, 100);
    return () => clearInterval(checkYT);
  }, []);

  const initializePlayer = () => {
    playerRef.current = new window.YT.Player("yt-player", {
      height: "0",
      width: "0",
      videoId: "",
      playerVars: {
        playsinline: 1,
        enablejsapi: 1,
        origin: window.location.origin
      },
      events: {
        onReady: (event) => {
          console.log("YouTube Player is ready");
          event.target.setVolume(volume);
        },
        onStateChange: (event) => {
          // window.YT.PlayerState.PLAYING = 1
          // window.YT.PlayerState.PAUSED = 2
          // window.YT.PlayerState.ENDED = 0
          if (event.data === 1) {
            setIsPlaying(true);
          } else if (event.data === 2 || event.data === 0) {
            setIsPlaying(false);
          }

          // When song ends, play next song in the queue
          if (event.data === 0) {
            // Use ref to avoid stale closure over queue state
            if (playNextRef.current) playNextRef.current();
          }
        }
      }
    });
  };

  // Poll current time while playing
  useEffect(() => {
    let timer;
    if (isPlaying && playerRef.current && playerRef.current.getCurrentTime) {
      timer = setInterval(() => {
        setCurrentTime(playerRef.current.getCurrentTime());
        if (playerRef.current.getDuration) {
          setDuration(playerRef.current.getDuration());
        }
      }, 500);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Initial search on mount
  useEffect(() => {
    performSearch("lofi chill beats", "All");
  }, []);

  const performSearch = async (queryToSearch, filterToUse) => {
    if (!queryToSearch.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/search?q=${encodeURIComponent(
          queryToSearch
        )}&filter=${filterToUse}`
      );
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Search API failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    performSearch(searchQuery, activeFilter);
  };

  // Trigger search when filter changes
  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery, activeFilter);
    }
  }, [activeFilter]);

  // Full play: resets queue from YouTube related tracks
  const playTrack = async (item) => {
    let videoId = item.videoId;
    let trackToPlay = item;

    if (!videoId) {
      setIsLoading(true);
      try {
        const queryName = item.title || item.name || item.artist;
        const res = await fetch(
          `http://localhost:8000/api/search?q=${encodeURIComponent(queryName)}&filter=songs`
        );
        const data = await res.json();
        if (data && data.length > 0) {
          videoId = data[0].videoId;
          trackToPlay = data[0];
        } else {
          alert("No playable track found.");
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error("Failed to fetch playable track:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (videoId) {
      setCurrentTrack(trackToPlay);
      setCurrentTime(0);
      setDuration(0);

      if (playerRef.current && playerRef.current.loadVideoById) {
        playerRef.current.loadVideoById(videoId);
        playerRef.current.playVideo();
        setIsPlaying(true);
      }

      addToRecentlyPlayed(trackToPlay);
      // Fresh play: rebuild queue from this track
      fetchQueueAndLyrics(videoId);
      setActiveTab("nowplaying");
    }
  };

  // Queue navigation: does NOT reset queue, only fetches lyrics
  const playFromQueue = async (item) => {
    const videoId = item.videoId;
    if (!videoId) return;

    setCurrentTrack(item);
    setCurrentTime(0);
    setDuration(0);

    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(videoId);
      playerRef.current.playVideo();
      setIsPlaying(true);
    }

    addToRecentlyPlayed(item);
    // Only refresh lyrics, NOT the queue
    fetchLyricsOnly(videoId);
  };

  const playNext = () => {
    const currentIndex = queue.findIndex(t => t.videoId === currentTrack?.videoId);
    if (currentIndex !== -1 && currentIndex + 1 < queue.length) {
      playFromQueue(queue[currentIndex + 1]);
    }
  };

  const playPrev = () => {
    const currentIndex = queue.findIndex(t => t.videoId === currentTrack?.videoId);
    if (currentIndex > 0) {
      playFromQueue(queue[currentIndex - 1]);
    }
  };

  // Keep playNextRef in sync so the YT player's onStateChange always calls the latest version
  playNextRef.current = playNext;

  const fetchQueueAndLyrics = async (videoId) => {
    setLyricsLoading(true);
    setLyrics("");
    setLyricsSnippet("");
    try {
      const res = await fetch(`http://localhost:8000/api/queue/${videoId}`);
      const data = await res.json();

      if (data && data.tracks) {
        setQueue(data.tracks);
      }

      // Try lyricsId from watch playlist first
      const lyricsId = data?.lyrics;
      if (lyricsId) {
        try {
          const lyricsRes = await fetch(`http://localhost:8000/api/lyrics/${lyricsId}`);
          const lyricsData = await lyricsRes.json();
          const lyricsText = lyricsData?.lyrics;
          if (lyricsText && !lyricsText.includes("not available") && !lyricsText.includes("Error")) {
            setLyrics(lyricsText);
            const lines = lyricsText.split("\n").filter(l => l.trim().length > 0);
            setLyricsSnippet(lines.slice(0, 3).join("\n"));
            return;
          }
        } catch (_) {}
      }

      // Fallback: get lyrics browse id from song details (enriched endpoint)
      try {
        const songRes = await fetch(`http://localhost:8000/api/song/${videoId}`);
        const songData = await songRes.json();
        // Our enriched endpoint adds lyricsId at top level; also check nested
        const songLyricsId =
          songData?.lyricsId ||
          songData?.lyrics?.lyricsId ||
          songData?.lyrics?.browseId ||
          null;
        if (songLyricsId) {
          const lyricsRes = await fetch(`http://localhost:8000/api/lyrics/${songLyricsId}`);
          const lyricsData = await lyricsRes.json();
          const lyricsText = lyricsData?.lyrics;
          if (lyricsText && !lyricsText.includes("not available")) {
            setLyrics(lyricsText);
            const lines = lyricsText.split("\n").filter(l => l.trim().length > 0);
            setLyricsSnippet(lines.slice(0, 3).join("\n"));
            return;
          }
        }
      } catch (_) {}

      setLyrics("Lyrics not available for this track.");
    } catch (err) {
      console.error("Queue/Lyrics fetch failed:", err);
      setLyrics("Could not load lyrics.");
    } finally {
      setLyricsLoading(false);
    }
  };

  // Lyrics-only fetch for queue navigation (does NOT update the queue)
  const fetchLyricsOnly = async (videoId) => {
    setLyricsLoading(true);
    setLyrics("");
    setLyricsSnippet("");
    try {
      // Try watch playlist lyrics ID first (fast path)
      const res = await fetch(`http://localhost:8000/api/queue/${videoId}`);
      const data = await res.json();
      const lyricsId = data?.lyrics;
      if (lyricsId) {
        try {
          const lyricsRes = await fetch(`http://localhost:8000/api/lyrics/${lyricsId}`);
          const lyricsData = await lyricsRes.json();
          const lyricsText = lyricsData?.lyrics;
          if (lyricsText && !lyricsText.includes("not available") && !lyricsText.includes("Error")) {
            setLyrics(lyricsText);
            const lines = lyricsText.split("\n").filter(l => l.trim().length > 0);
            setLyricsSnippet(lines.slice(0, 3).join("\n"));
            return;
          }
        } catch (_) {}
      }
      // Fallback: song endpoint
      try {
        const songRes = await fetch(`http://localhost:8000/api/song/${videoId}`);
        const songData = await songRes.json();
        const songLyricsId = songData?.lyricsId || songData?.lyrics?.lyricsId || songData?.lyrics?.browseId || null;
        if (songLyricsId) {
          const lyricsRes = await fetch(`http://localhost:8000/api/lyrics/${songLyricsId}`);
          const lyricsData = await lyricsRes.json();
          const lyricsText = lyricsData?.lyrics;
          if (lyricsText && !lyricsText.includes("not available")) {
            setLyrics(lyricsText);
            const lines = lyricsText.split("\n").filter(l => l.trim().length > 0);
            setLyricsSnippet(lines.slice(0, 3).join("\n"));
            return;
          }
        }
      } catch (_) {}
      setLyrics("Lyrics not available for this track.");
    } catch (err) {
      console.error("Lyrics fetch failed:", err);
      setLyrics("Could not load lyrics.");
    } finally {
      setLyricsLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (!currentTrack && searchResults.length > 0) {
      // Play top result if nothing is playing
      playTrack(searchResults[0]);
      return;
    }

    if (isPlaying) {
      playerRef.current?.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current?.playVideo();
      setIsPlaying(true);
    }
  };

  const handleSeek = (time) => {
    playerRef.current?.seekTo(time, true);
    setCurrentTime(time);
  };

  const handleVolumeChange = (vol) => {
    playerRef.current?.setVolume(vol);
    setVolume(vol);
  };

  // Local storage library sync
  const toggleLike = () => {
    if (!currentTrack) return;
    setLikedSongs((prev) => {
      let updated;
      const exists = prev.some((s) => s.videoId === currentTrack.videoId);
      if (exists) {
        updated = prev.filter((s) => s.videoId !== currentTrack.videoId);
      } else {
        updated = [currentTrack, ...prev];
      }
      localStorage.setItem("yt_liked_songs", JSON.stringify(updated));
      return updated;
    });
  };

  const isCurrentTrackLiked = currentTrack
    ? likedSongs.some((s) => s.videoId === currentTrack.videoId)
    : false;

  const addToRecentlyPlayed = (track) => {
    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((s) => s.videoId !== track.videoId);
      const updated = [track, ...filtered].slice(0, 10);
      localStorage.setItem("yt_recent_played", JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromRecentlyPlayed = (videoId) => {
    setRecentlyPlayed((prev) => {
      const updated = prev.filter((s) => s.videoId !== videoId);
      localStorage.setItem("yt_recent_played", JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentlyPlayed = () => {
    setRecentlyPlayed([]);
    localStorage.removeItem("yt_recent_played");
  };

  const createPlaylist = (name) => {
    setPlaylists((prev) => {
      const updated = [...prev, { name, tracks: [] }];
      localStorage.setItem("yt_playlists", JSON.stringify(updated));
      return updated;
    });
  };

  const playPlaylist = (name, tracks) => {
    if (tracks && tracks.length > 0) {
      setQueue(tracks);
      playTrack(tracks[0]);
    }
  };

  return (
    <div className="min-h-screen relative pb-32">
      {/* Dynamic blurred glow layer */}
      <div className="spatial-bg"></div>

      {/* Hidden YouTube player frame */}
      <div id="yt-player" className="absolute w-[1px] h-[1px] opacity-0 pointer-events-none overflow-hidden"></div>

      {/* Sidebar Navigation */}
      <SideNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentTrack={currentTrack}
      />

      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 w-full flex justify-between items-center px-6 md:px-margin-page py-4 md:py-gutter z-40 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-4">
          <h1 
            onClick={() => setActiveTab("home")}
            className="font-bold text-xl md:text-2xl lg:text-3xl text-primary tracking-tighter cursor-pointer hover:opacity-80 transition-opacity"
          >
            Aero Music
          </h1>
        </div>

        <div className="flex items-center gap-4 md:gap-6 flex-grow justify-end pr-2 md:pr-0">
          {!isHome && (
            <div className="w-36 sm:w-48 md:w-64 relative group">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-primary/45 group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-lg">search</span>
              </div>
              <input
                type="text"
                className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-full py-1.5 pl-9 pr-8 font-body-lg text-xs text-primary focus:outline-none focus:ring-1 focus:ring-white/20 focus:bg-white/10 transition-all placeholder:text-white/30"
                placeholder="Search music..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                    setActiveTab("home");
                  }
                }}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-3 flex items-center text-primary/40 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="pt-24 md:pt-28 pb-36 md:pb-32 px-4 md:px-6 md:pl-36 md:pr-margin-page max-w-7xl mx-auto">
        <Outlet context={{
          // Search states & methods
          searchQuery,
          setSearchQuery,
          activeFilter,
          setActiveFilter,
          searchResults,
          isLoading,
          onSearch: handleSearch,
          onPlayTrack: playTrack,
          onPlayFromQueue: playFromQueue,

          // Track states & playback methods
          currentTrack,
          queue,
          lyricsSnippet,
          lyrics,
          lyricsLoading,
          isPlaying,
          currentTime,
          duration,
          isLiked: isCurrentTrackLiked,
          onPlayPause: handlePlayPause,
          onNext: playNext,
          onPrev: playPrev,
          onSeek: handleSeek,
          onToggleLike: toggleLike,
          setActiveTab,

          // Library states & methods
          likedSongs,
          playlists,
          recentlyPlayed,
          onPlayPlaylist: playPlaylist,
          onCreatePlaylist: createPlaylist,
          onRemoveRecentlyPlayed: removeFromRecentlyPlayed,
          onClearRecentlyPlayed: clearRecentlyPlayed
        }} />
      </main>

      {/* Bottom Playback bar */}
      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isLiked={isCurrentTrackLiked}
        onPlayPause={handlePlayPause}
        onNext={playNext}
        onPrev={playPrev}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleLike={toggleLike}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
}
