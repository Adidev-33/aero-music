import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";

export default function LibraryView() {
  const navigate = useNavigate();
  const {
    likedSongs = [],
    playlists = [],
    recentlyPlayed = [],
    onPlayTrack,
    onPlayPlaylist,
    onCreatePlaylist,
    onRemoveRecentlyPlayed,
    onClearRecentlyPlayed
  } = useOutletContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);

  const handleCreatePlaylistSubmit = (e) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName("");
      setShowCreateModal(false);
    }
  };

  const getTrackImage = (track) => {
    if (track?.thumbnail && track.thumbnail.length > 0) {
      return track.thumbnail[track.thumbnail.length - 1].url;
    }
    if (track?.thumbnails && track.thumbnails.length > 0) {
      return track.thumbnails[track.thumbnails.length - 1].url;
    }
    return "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop";
  };

  const playLikedSongs = () => {
    if (likedSongs.length > 0) {
      onPlayPlaylist("Liked Songs", likedSongs);
    }
  };

  return (
    <div className="w-full text-left">
      {/* Playlists Section */}
      <section className="mb-14">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="font-bold text-headline-md text-primary">Playlists</h2>
            <p className="text-on-surface-variant text-sm opacity-60">Created by you</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-primary border border-white/10 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Create Playlist
          </button>
        </div>

        <div className="flex gap-gutter overflow-x-auto pb-4 custom-scrollbar snap-x no-scrollbar">
          {playlists.length > 0 ? (
            playlists.map((playlist, idx) => {
              const coverImg = playlist.tracks && playlist.tracks.length > 0 
                ? getTrackImage(playlist.tracks[0])
                : "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop";
              return (
                <div
                  key={idx}
                  onClick={() => navigate(`/playlist/${encodeURIComponent(playlist.name)}`)}
                  className="flex-shrink-0 w-60 snap-start group cursor-pointer"
                >
                  <div className="glass-card aspect-square rounded-lg mb-4 overflow-hidden relative border border-white/5">
                    <img
                      src={coverImg}
                      alt={playlist.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayPlaylist(playlist.name, playlist.tracks);
                        }}
                        className="w-14 h-14 rounded-full bg-primary text-background flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-lg glow-button"
                      >
                        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          play_arrow
                        </span>
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-body-lg text-primary truncate">
                    {playlist.name}
                  </h3>
                  <p className="text-on-surface-variant text-xs opacity-60">
                    {playlist.tracks?.length || 0} Tracks
                  </p>
                </div>
              );
            })
          ) : (
            <div 
              onClick={() => setShowCreateModal(true)}
              className="flex-shrink-0 w-60 aspect-square rounded-lg glass-panel flex flex-col items-center justify-center text-center p-6 border border-white/5 cursor-pointer hover:bg-white/5 group transition-all"
            >
              <span className="material-symbols-outlined text-4xl text-white/20 mb-3 group-hover:scale-110 group-hover:text-primary transition-all">add_circle</span>
              <h4 className="font-semibold text-sm text-primary">No playlists yet</h4>
              <p className="text-xs text-on-surface-variant mt-1">Click to create your first playlist.</p>
            </div>
          )}
        </div>
      </section>

      {/* Liked Songs Section */}
      <section className="mb-14">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="font-bold text-headline-md text-primary">Liked Songs</h2>
            <p className="text-on-surface-variant text-sm opacity-60">Your favorite tracks</p>
          </div>
        </div>

        <div 
          onClick={() => navigate("/likedsongs")}
          className={`glass-panel rounded-lg p-6 flex items-center gap-gutter group cursor-pointer hover:bg-white/5 transition-all border border-white/5 ${
            likedSongs.length === 0 ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-4xl md:text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              favorite
            </span>
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="font-bold text-lg md:text-xl text-primary">Liked Songs Collection</h3>
            <p className="text-sm text-on-surface-variant mt-1">
              {likedSongs.length} songs liked
            </p>
          </div>
          {likedSongs.length > 0 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                playLikedSongs();
              }}
              className="w-14 h-14 rounded-full bg-primary text-background flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-lg glow-button"
            >
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                play_arrow
              </span>
            </button>
          )}
        </div>
      </section>

      {/* Recently Played Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-bold text-headline-md text-primary">Recently Played</h2>
            <p className="text-on-surface-variant text-sm opacity-60">Back to what you were listening to</p>
          </div>
          {recentlyPlayed.length > 0 && (
            <button
              onClick={() => setConfirmClearHistory(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
              Clear History
            </button>
          )}
        </div>

        {recentlyPlayed.length > 0 ? (
          <div className="flex gap-element-gap overflow-x-auto pb-4 custom-scrollbar no-scrollbar">
            {recentlyPlayed.map((track, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-40 group cursor-pointer relative"
              >
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveRecentlyPlayed(track.videoId);
                  }}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/70 hover:scale-110"
                  title="Remove from history"
                >
                  <span className="material-symbols-outlined text-[14px] text-white">close</span>
                </button>

                <div
                  onClick={() => onPlayTrack(track)}
                  className="glass-card aspect-square rounded-lg mb-3 overflow-hidden relative border border-white/5"
                >
                  <img
                    src={getTrackImage(track)}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      play_circle
                    </span>
                  </div>
                </div>
                <div
                  onClick={() => onPlayTrack(track)}
                  className="text-center px-1"
                >
                  <h3 className="font-semibold text-xs text-primary truncate">
                    {track.title}
                  </h3>
                  <p className="text-on-surface-variant text-[10px] truncate mt-0.5">
                    {track.artists?.map(a => a.name).join(", ") || "Artist"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-white/20 w-full flex flex-col items-center">
            <span className="material-symbols-outlined text-4xl mb-2">history</span>
            <p className="text-xs">No tracks recently played yet.</p>
          </div>
        )}
      </section>

      {/* Confirm Clear History Modal */}
      {confirmClearHistory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-white/10 rounded-lg p-6 w-full max-w-sm shadow-2xl glass-panel">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-red-400 text-3xl">delete_forever</span>
              <h3 className="text-lg font-bold text-primary">Clear History?</h3>
            </div>
            <p className="text-sm text-on-surface-variant mb-6">
              This will permanently delete your entire listening history. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmClearHistory(false)}
                className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearRecentlyPlayed();
                  setConfirmClearHistory(false);
                }}
                className="px-4 py-2 rounded-lg text-sm bg-red-500 text-white font-semibold hover:bg-red-400 active:scale-95 transition-all"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-white/10 rounded-lg p-6 w-full max-w-md shadow-2xl glass-panel">
            <h3 className="text-lg font-bold text-primary mb-4">Create Playlist</h3>
            <form onSubmit={handleCreatePlaylistSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  Playlist Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="e.g. Chill Mix, Coding Sessions"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm bg-primary text-background font-semibold hover:bg-white/90 active:scale-95 transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
