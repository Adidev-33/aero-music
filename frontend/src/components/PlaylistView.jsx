import React from "react";
import { useOutletContext, useNavigate, useParams } from "react-router-dom";

export default function PlaylistView() {
  const { name } = useParams();
  const {
    playlists = [],
    currentTrack,
    isPlaying,
    onPlayCustomQueue,
    onRemoveTrackFromPlaylist,
    onDeletePlaylist
  } = useOutletContext();
  const navigate = useNavigate();

  const playlist = playlists.find((pl) => pl.name === decodeURIComponent(name));

  if (!playlist) {
    return (
      <div className="py-20 text-center text-white/30">
        <h2 className="font-semibold text-lg text-primary">Playlist not found</h2>
        <button
          onClick={() => navigate("/library")}
          className="mt-4 px-4 py-2 rounded-full bg-primary text-background font-semibold"
        >
          Go to Library
        </button>
      </div>
    );
  }

  const getTrackImage = (track) => {
    if (track?.thumbnail && track.thumbnail.length > 0) {
      return track.thumbnail[track.thumbnail.length - 1].url;
    }
    if (track?.thumbnails && track.thumbnails.length > 0) {
      return track.thumbnails[track.thumbnails.length - 1].url;
    }
    return "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop";
  };

  const getTrackSubtitle = (track) => {
    if (track?.artists) {
      return track.artists.map(a => a.name).join(", ");
    }
    return track.artist || "Unknown Artist";
  };

  const isCurrentPlaying = (track) => {
    return currentTrack && currentTrack.videoId === track.videoId;
  };

  const handlePlaySong = (track) => {
    onPlayCustomQueue(playlist.tracks, track);
  };

  const handlePlayAll = () => {
    if (playlist.tracks.length > 0) {
      onPlayCustomQueue(playlist.tracks, playlist.tracks[0]);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the playlist "${playlist.name}"?`)) {
      onDeletePlaylist(playlist.name);
      navigate("/library");
    }
  };

  const firstTrackImage = playlist.tracks.length > 0 ? getTrackImage(playlist.tracks[0]) : "";

  return (
    <div className="w-full text-left">
      {/* Back Header */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => navigate("/library")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-secondary hover:text-primary hover:bg-white/5 border border-white/5 transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Library
        </button>

        <button
          onClick={handleDelete}
          className="flex items-center gap-1 px-4 py-2 rounded-full text-xs font-semibold text-red-400 hover:text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">delete</span>
          Delete Playlist
        </button>
      </div>

      {/* Hero Banner Area */}
      <div className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 border border-white/5 bg-gradient-to-br from-blue-900/30 via-surface-variant/10 to-transparent mb-10 shadow-2xl relative overflow-hidden">
        {/* Banner Artwork */}
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl flex-shrink-0 relative overflow-hidden group">
          {firstTrackImage ? (
            <img
              src={firstTrackImage}
              alt={playlist.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="material-symbols-outlined text-white/20 text-6xl">
              playlist_play
            </span>
          )}
        </div>

        {/* Banner details */}
        <div className="flex-grow text-center md:text-left">
          <span className="text-[10px] uppercase font-bold tracking-widest text-secondary block mb-1">Playlist</span>
          <h1 className="font-display-lg text-primary text-3xl md:text-5xl mb-2 tracking-tight">{playlist.name}</h1>
          <p className="text-on-surface-variant text-sm mt-1 opacity-85">
            Playlist • <strong className="text-primary">{playlist.tracks.length} songs</strong>
          </p>
          
          {playlist.tracks.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start items-center">
              <button
                onClick={handlePlayAll}
                className="px-6 py-3 rounded-full bg-primary text-background font-bold hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  play_arrow
                </span>
                Play Playlist
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Song List section */}
      <section className="glass-panel rounded-2xl p-4 md:p-6 border border-white/5">
        {playlist.tracks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4 hidden md:table-cell">Artists</th>
                  <th className="py-3 px-4 w-20 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {playlist.tracks.map((track, index) => {
                  const isCurrent = isCurrentPlaying(track);
                  return (
                    <tr
                      key={track.videoId}
                      onClick={() => handlePlaySong(track)}
                      className={`group hover:bg-white/5 transition-colors cursor-pointer ${isCurrent ? "bg-white/5" : ""}`}
                    >
                      {/* Index / Playing icon */}
                      <td className="py-3 px-4 text-center font-semibold text-xs text-on-surface-variant group-hover:text-primary">
                        {isCurrent && isPlaying ? (
                          <div className="flex items-center justify-center gap-0.5 h-3">
                            <span className="w-0.5 bg-secondary animate-pulse h-3"></span>
                            <span className="w-0.5 bg-secondary animate-pulse h-2" style={{ animationDelay: '0.1s' }}></span>
                            <span className="w-0.5 bg-secondary animate-pulse h-4" style={{ animationDelay: '0.2s' }}></span>
                          </div>
                        ) : (
                          index + 1
                        )}
                      </td>

                      {/* Cover & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getTrackImage(track)}
                            alt={track.title}
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <p className={`font-semibold text-sm truncate ${isCurrent ? "text-secondary" : "text-primary"}`}>
                              {track.title}
                            </p>
                            <p className="text-xs text-on-surface-variant truncate md:hidden">
                              {getTrackSubtitle(track)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Artists (Desktop) */}
                      <td className="py-3 px-4 hidden md:table-cell text-sm text-on-surface-variant truncate">
                        {getTrackSubtitle(track)}
                      </td>

                      {/* Actions (Remove) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveTrackFromPlaylist(playlist.name, track.videoId);
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-red-400/80 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Remove from Playlist"
                          >
                            <span className="material-symbols-outlined text-lg">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-white/30 flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-white/10 mb-4 animate-pulse">playlist_play</span>
            <p className="font-semibold text-sm">This playlist is empty</p>
            <p className="text-xs text-on-surface-variant mt-1 max-w-xs text-center">
              Search for tracks and add them to this playlist.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
