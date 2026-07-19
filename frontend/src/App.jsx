import React, { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import SideNavBar from "./components/SideNavBar";
import PlayerBar from "./components/PlayerBar";
import BottomNavBar from "./components/BottomNavBar";
import InstallPrompt from "./components/InstallPrompt";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const SILENT_AUDIO_URL = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.replace(/^\//, "") || "home";
  const setActiveTab = (tab) => navigate(`/${tab}`);
  const isHome = activeTab === "home" || activeTab === "";
  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  
  const silentAudioRef = useRef(null);

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
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState("none"); // "none" | "all" | "one"
  const [trackToAdd, setTrackToAdd] = useState(null);

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

  // Web Audio API silent context — keeps the browser audio session alive through
  // screen lock and app switches (same technique used by Spotify/YouTube Music web)
  const audioCtxRef = useRef(null);
  const silentSourceRef = useRef(null);

  const startSilentAudioContext = () => {
    try {
      if (audioCtxRef.current) return; // already running
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;

      // Create a 1-second silent buffer that loops forever
      const bufferSize = ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      // buffer data is silent (all zeros) by default

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(ctx.destination);
      source.start();
      silentSourceRef.current = source;
    } catch (e) {
      console.log("AudioContext silent keepalive failed:", e);
    }
  };

  const resumeSilentAudioContext = () => {
    try {
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }
    } catch (_) {}
  };

  // Start/stop the silent audio context with playback
  useEffect(() => {
    if (isPlaying) {
      startSilentAudioContext();
      resumeSilentAudioContext();
      // Also keep the <audio> tag playing as a secondary fallback
      if (silentAudioRef.current) {
        silentAudioRef.current.play().catch(() => {});
      }
    } else {
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const playerRef = useRef(null);
  // Ref so the YT player's onStateChange closure always has the latest playNext
  const playNextRef = useRef(null);
  // Track if we were playing before page was hidden (another app fullscreened etc.)
  const wasPlayingRef = useRef(false);

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
        origin: window.location.origin,
        // Prevents YouTube from auto-pausing when the iframe loses focus
        background: 1,
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

  // Resume playback when the page becomes visible again
  // (screen unlock, alt-tab back, another app exiting fullscreen)
  useEffect(() => {
    const resumePlayback = () => {
      resumeSilentAudioContext();
      if (wasPlayingRef.current && playerRef.current?.playVideo) {
        // Retry up to 5 times with increasing delays — mobile browsers
        // need a moment to restore the audio session after screen unlock
        const delays = [200, 600, 1200, 2000, 3000];
        delays.forEach(delay => {
          setTimeout(() => {
            try {
              if (playerRef.current?.getPlayerState?.() !== 1) {
                playerRef.current.playVideo();
                resumeSilentAudioContext();
              }
            } catch (_) {}
          }, delay);
        });
        wasPlayingRef.current = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasPlayingRef.current = !!playerRef.current &&
          typeof playerRef.current.getPlayerState === "function" &&
          playerRef.current.getPlayerState() === 1;
      } else {
        resumePlayback();
      }
    };

    // iOS Safari uses pageshow/pagehide instead of visibilitychange in some cases
    const handlePageShow = (e) => {
      if (!e.persisted) return; // only care about BFCache restores
      resumePlayback();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

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
        `${API_BASE}/api/search?q=${encodeURIComponent(
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

  const handleSearch = (customQuery) => {
    const q = (typeof customQuery === "string") ? customQuery : searchQuery;
    if (typeof customQuery === "string") {
      setSearchQuery(customQuery);
    }
    performSearch(q, activeFilter);
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
          `${API_BASE}/api/search?q=${encodeURIComponent(queryName)}&filter=songs`
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
      fetchQueueAndLyrics(videoId, trackToPlay);
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
    fetchLyricsOnly(videoId, item);
  };

  const handleToggleShuffle = () => {
    setShuffle((prev) => !prev);
  };

  const handleToggleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === "none") return "all";
      if (prev === "all") return "one";
      return "none";
    });
  };

  const playNext = () => {
    if (!queue || queue.length === 0) return;

    if (repeatMode === "one" && currentTrack) {
      playFromQueue(currentTrack);
      return;
    }

    if (shuffle) {
      if (queue.length === 1) {
        playFromQueue(queue[0]);
      } else {
        const otherTracks = queue.filter((t) => t.videoId !== currentTrack?.videoId);
        const randomTrack = otherTracks[Math.floor(Math.random() * otherTracks.length)];
        playFromQueue(randomTrack);
      }
      return;
    }

    const currentIndex = queue.findIndex((t) => t.videoId === currentTrack?.videoId);
    if (currentIndex !== -1) {
      if (currentIndex + 1 < queue.length) {
        playFromQueue(queue[currentIndex + 1]);
      } else if (repeatMode === "all") {
        playFromQueue(queue[0]);
      }
    } else {
      playFromQueue(queue[0]);
    }
  };

  const playPrev = () => {
    if (!queue || queue.length === 0) return;

    if (shuffle) {
      if (queue.length === 1) {
        playFromQueue(queue[0]);
      } else {
        const otherTracks = queue.filter((t) => t.videoId !== currentTrack?.videoId);
        const randomTrack = otherTracks[Math.floor(Math.random() * otherTracks.length)];
        playFromQueue(randomTrack);
      }
      return;
    }

    const currentIndex = queue.findIndex((t) => t.videoId === currentTrack?.videoId);
    if (currentIndex > 0) {
      playFromQueue(queue[currentIndex - 1]);
    } else if (repeatMode === "all") {
      playFromQueue(queue[queue.length - 1]);
    }
  };

  // Keep playNextRef in sync so the YT player's onStateChange always calls the latest version
  playNextRef.current = playNext;

  // Media Session Metadata Sync (runs on track change AND state transitions to override YouTube defaults)
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      const artistName = currentTrack.artists?.map(a => a.name).join(", ") || currentTrack.artist || "Unknown Artist";
      
      let artworkUrl = "";
      const trackImageUrl = currentTrack.thumbnail || currentTrack.thumbnails;
      if (typeof trackImageUrl === "string") {
        artworkUrl = trackImageUrl;
      } else if (Array.isArray(trackImageUrl) && trackImageUrl.length > 0) {
        const lastThumb = trackImageUrl[trackImageUrl.length - 1];
        artworkUrl = typeof lastThumb === "string" ? lastThumb : lastThumb?.url || "";
      }

      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentTrack.title,
        artist: artistName,
        album: currentTrack.album?.name || "Aero Music",
        artwork: artworkUrl ? [{ src: artworkUrl, sizes: "512x512", type: "image/png" }] : []
      });
    }
  }, [currentTrack, isPlaying]);

  // Media Session Playback State Sync
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  }, [isPlaying]);

  // Media Session Playback Position Sync (shows progress slider on Windows lockscreen)
  useEffect(() => {
    if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1.0,
          position: Math.max(0, Math.min(currentTime, duration))
        });
      } catch (e) {
        console.log("Error updating MediaSession position:", e);
      }
    }
  }, [currentTime, duration]);

  // Media Session Lockscreen Actions Bind
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler("play", () => {
        playerRef.current?.playVideo();
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        playerRef.current?.pauseVideo();
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        playPrev();
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        playNext();
      });
      try {
        navigator.mediaSession.setActionHandler("seekto", (details) => {
          if (playerRef.current?.seekTo) {
            playerRef.current.seekTo(details.seekTime, true);
          }
          setCurrentTime(details.seekTime);
        });
      } catch (e) {
        console.log("MediaSession seekto not supported");
      }
    }
  }, [queue, currentTrack, isPlaying]);

  const fetchQueueAndLyrics = async (videoId, trackToUse) => {
    const track = trackToUse || currentTrack;
    setLyricsLoading(true);
    setLyrics("");
    setLyricsSnippet("");
    
    const getLyricsUrl = (lyricsId) => {
      const base = `${API_BASE}/api/lyrics/${lyricsId}`;
      if (!track) return base;
      const title = track.title || "";
      const artist = track.artists?.map(a => a.name).join(", ") || track.artist || "";
      const durationSec = track.duration_seconds || track.duration || 0;
      return `${base}?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}&duration=${durationSec}`;
    };

    try {
      const res = await fetch(`${API_BASE}/api/queue/${videoId}`);
      const data = await res.json();

      if (data && data.tracks) {
        setQueue(data.tracks);
      }

      // Try lyricsId from watch playlist first
      const lyricsId = data?.lyrics;
      if (lyricsId) {
        try {
          const lyricsRes = await fetch(getLyricsUrl(lyricsId));
          const lyricsData = await lyricsRes.json();
          const lyricsText = lyricsData?.lyrics;
          if (lyricsText && !lyricsText.includes("not available") && !lyricsText.includes("Error")) {
            setLyrics(lyricsText);
            const cleanLines = lyricsText.split("\n")
              .map(l => l.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, "").trim())
              .filter(l => l.length > 0);
            setLyricsSnippet(cleanLines.slice(0, 3).join("\n"));
            return;
          }
        } catch (_) {}
      }

      // Fallback: get lyrics browse id from song details (enriched endpoint)
      try {
        const songRes = await fetch(`${API_BASE}/api/song/${videoId}`);
        const songData = await songRes.json();
        // Our enriched endpoint adds lyricsId at top level; also check nested
        const songLyricsId =
          songData?.lyricsId ||
          songData?.lyrics?.lyricsId ||
          songData?.lyrics?.browseId ||
          null;
        if (songLyricsId) {
          const lyricsRes = await fetch(getLyricsUrl(songLyricsId));
          const lyricsData = await lyricsRes.json();
          const lyricsText = lyricsData?.lyrics;
          if (lyricsText && !lyricsText.includes("not available")) {
            setLyrics(lyricsText);
            const cleanLines = lyricsText.split("\n")
              .map(l => l.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, "").trim())
              .filter(l => l.length > 0);
            setLyricsSnippet(cleanLines.slice(0, 3).join("\n"));
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
  const fetchLyricsOnly = async (videoId, trackToUse) => {
    const track = trackToUse || currentTrack;
    setLyricsLoading(true);
    setLyrics("");
    setLyricsSnippet("");
    
    const getLyricsUrl = (lyricsId) => {
      const base = `${API_BASE}/api/lyrics/${lyricsId}`;
      if (!track) return base;
      const title = track.title || "";
      const artist = track.artists?.map(a => a.name).join(", ") || track.artist || "";
      const durationSec = track.duration_seconds || track.duration || 0;
      return `${base}?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}&duration=${durationSec}`;
    };

    try {
      // Try watch playlist lyrics ID first (fast path)
      const res = await fetch(`${API_BASE}/api/queue/${videoId}`);
      const data = await res.json();
      const lyricsId = data?.lyrics;
      if (lyricsId) {
        try {
          const lyricsRes = await fetch(getLyricsUrl(lyricsId));
          const lyricsData = await lyricsRes.json();
          const lyricsText = lyricsData?.lyrics;
          if (lyricsText && !lyricsText.includes("not available") && !lyricsText.includes("Error")) {
            setLyrics(lyricsText);
            const cleanLines = lyricsText.split("\n")
              .map(l => l.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, "").trim())
              .filter(l => l.length > 0);
            setLyricsSnippet(cleanLines.slice(0, 3).join("\n"));
            return;
          }
        } catch (_) {}
      }
      // Fallback: song endpoint
      try {
        const songRes = await fetch(`${API_BASE}/api/song/${videoId}`);
        const songData = await songRes.json();
        const songLyricsId = songData?.lyricsId || songData?.lyrics?.lyricsId || songData?.lyrics?.browseId || null;
        if (songLyricsId) {
          const lyricsRes = await fetch(getLyricsUrl(songLyricsId));
          const lyricsData = await lyricsRes.json();
          const lyricsText = lyricsData?.lyrics;
          if (lyricsText && !lyricsText.includes("not available")) {
            setLyrics(lyricsText);
            const cleanLines = lyricsText.split("\n")
              .map(l => l.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, "").trim())
              .filter(l => l.length > 0);
            setLyricsSnippet(cleanLines.slice(0, 3).join("\n"));
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
  const toggleLike = (trackToToggle) => {
    const track = trackToToggle || currentTrack;
    if (!track) return;
    setLikedSongs((prev) => {
      let updated;
      const exists = prev.some((s) => s.videoId === track.videoId);
      if (exists) {
        updated = prev.filter((s) => s.videoId !== track.videoId);
      } else {
        updated = [track, ...prev];
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

  const playCustomQueue = (tracks, trackToPlay) => {
    if (tracks && tracks.length > 0) {
      setQueue(tracks);
      if (trackToPlay) {
        playFromQueue(trackToPlay);
      } else {
        playFromQueue(tracks[0]);
      }
    }
  };

  const addTrackToPlaylist = (playlistName, track) => {
    setPlaylists((prev) => {
      const updated = prev.map((pl) => {
        if (pl.name === playlistName) {
          const exists = pl.tracks.some((t) => t.videoId === track.videoId);
          if (exists) return pl;
          return { ...pl, tracks: [...pl.tracks, track] };
        }
        return pl;
      });
      localStorage.setItem("yt_playlists", JSON.stringify(updated));
      return updated;
    });
  };

  const removeTrackFromPlaylist = (playlistName, videoId) => {
    setPlaylists((prev) => {
      const updated = prev.map((pl) => {
        if (pl.name === playlistName) {
          return { ...pl, tracks: pl.tracks.filter((t) => t.videoId !== videoId) };
        }
        return pl;
      });
      localStorage.setItem("yt_playlists", JSON.stringify(updated));
      return updated;
    });
  };

  const deletePlaylist = (playlistName) => {
    setPlaylists((prev) => {
      const updated = prev.filter((pl) => pl.name !== playlistName);
      localStorage.setItem("yt_playlists", JSON.stringify(updated));
      return updated;
    });
  };

  const isFitScreen = activeTab === "nowplaying" || activeTab === "lyrics";

  const outerWrapperClass = isFitScreen 
    ? "h-screen overflow-hidden relative" 
    : "min-h-screen relative pb-32";

  const mainContainerClass = isFitScreen
    ? "pt-20 md:pt-24 pb-4 px-4 md:px-6 md:pl-36 md:pr-margin-page max-w-7xl mx-auto h-[calc(100vh-110px)] overflow-hidden w-full"
    : "pt-24 md:pt-28 pb-36 md:pb-32 px-4 md:px-6 md:pl-36 md:pr-margin-page max-w-7xl mx-auto";

  return (
    <div className={outerWrapperClass}>
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
      </header>

      {/* Main Container */}
      <main className={mainContainerClass}>
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
          shuffle,
          repeatMode,
          isLiked: isCurrentTrackLiked,
          onPlayPause: handlePlayPause,
          onNext: playNext,
          onPrev: playPrev,
          onSeek: handleSeek,
          onToggleLike: toggleLike,
          onToggleShuffle: handleToggleShuffle,
          onToggleRepeat: handleToggleRepeat,
          onPlayCustomQueue: playCustomQueue,
          onAddToPlaylistTrigger: (track) => setTrackToAdd(track),
          onRemoveTrackFromPlaylist: removeTrackFromPlaylist,
          onDeletePlaylist: deletePlaylist,
          setActiveTab,

          // Library states & methods
          likedSongs,
          playlists,
          recentlyPlayed,
          onPlayPlaylist: playPlaylist,
          onCreatePlaylist: createPlaylist,
          onAddTrackToPlaylist: addTrackToPlaylist,
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
        shuffle={shuffle}
        repeat={repeatMode}
        isLiked={isCurrentTrackLiked}
        onPlayPause={handlePlayPause}
        onNext={playNext}
        onPrev={playPrev}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleLike={toggleLike}
        onToggleShuffle={handleToggleShuffle}
        onToggleRepeat={handleToggleRepeat}
        onAddToPlaylistTrigger={(track) => setTrackToAdd(track)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      {/* Silent audio for background session keeper */}
      <audio ref={silentAudioRef} loop src={SILENT_AUDIO_URL} className="hidden"></audio>

      {/* Add to Playlist Modal */}
      {trackToAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-white/10 rounded-lg p-6 w-full max-w-sm shadow-2xl glass-panel text-left">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">playlist_add</span>
                Add to Playlist
              </h3>
              <button 
                onClick={() => setTrackToAdd(null)} 
                className="text-white/40 hover:text-white/70"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-xs text-on-surface-variant mb-4 truncate">
              Select a playlist for: <strong className="text-primary">{trackToAdd.title}</strong>
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
              {playlists.length > 0 ? (
                playlists.map((playlist, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      addTrackToPlaylist(playlist.name, trackToAdd);
                      setTrackToAdd(null);
                    }}
                    className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 text-sm font-semibold text-primary truncate"
                  >
                    {playlist.name}
                  </button>
                ))
              ) : (
                <div className="text-center py-6 text-white/30 text-xs">
                  <p>No playlists created yet.</p>
                  <button
                    onClick={() => {
                      setTrackToAdd(null);
                      setActiveTab("library");
                    }}
                    className="mt-2 text-secondary underline hover:text-primary"
                  >
                    Create a playlist in Library
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
