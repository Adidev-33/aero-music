from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from ytmusicapi import YTMusic
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ytmusic-backend")

app = FastAPI(title="Spatial YTMusic Player Backend")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize YTMusic
try:
    logger.info("Initializing YTMusic client...")
    # Using unauthenticated browsing (no oauth.json)
    yt = YTMusic()
    logger.info("YTMusic client initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize YTMusic: {e}")
    yt = None

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Spatial YTMusic Player Backend is running"}

@app.get("/api/search")
def search(q: str = Query(..., description="Search query"), filter: str = Query(None, description="Optional filter: songs, videos, albums, artists, playlists")):
    if not yt:
        raise HTTPException(status_code=500, detail="YTMusic client not initialized")
    try:
        logger.info(f"Searching for '{q}' with filter={filter}")
        # Map frontend filters to ytmusicapi filters
        yt_filter = None
        if filter:
            filter_lower = filter.lower()
            if filter_lower in ["songs", "song"]:
                yt_filter = "songs"
            elif filter_lower in ["artists", "artist"]:
                yt_filter = "artists"
            elif filter_lower in ["albums", "album"]:
                yt_filter = "albums"
            elif filter_lower in ["playlists", "playlist"]:
                yt_filter = "playlists"
            elif filter_lower in ["videos", "video"]:
                yt_filter = "videos"
        
        results = yt.search(q, filter=yt_filter)
        return results
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/song/{video_id}")
def get_song(video_id: str):
    if not yt:
        raise HTTPException(status_code=500, detail="YTMusic client not initialized")
    try:
        logger.info(f"Fetching song details for video_id={video_id}")
        song_details = yt.get_song(video_id)
        # Enrich with lyrics browse ID from watch playlist
        try:
            watch = yt.get_watch_playlist(videoId=video_id)
            if watch and watch.get("lyrics"):
                song_details["lyricsId"] = watch["lyrics"]
        except Exception:
            pass
        return song_details
    except Exception as e:
        logger.error(f"Failed to get song {video_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/queue/{video_id}")
def get_queue(video_id: str):
    if not yt:
        raise HTTPException(status_code=500, detail="YTMusic client not initialized")
    try:
        logger.info(f"Fetching watch playlist queue for video_id={video_id}")
        queue_data = yt.get_watch_playlist(videoId=video_id)
        return queue_data
    except Exception as e:
        logger.error(f"Failed to get queue for {video_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/lyrics/{browse_id}")
def get_lyrics(browse_id: str):
    if not yt:
        raise HTTPException(status_code=500, detail="YTMusic client not initialized")
    try:
        logger.info(f"Fetching lyrics for browse_id={browse_id}")
        lyrics_data = yt.get_lyrics(browse_id)
        if lyrics_data and lyrics_data.get("lyrics"):
            return lyrics_data
        return {"lyrics": "Lyrics not available for this track.", "source": "Fallback"}
    except Exception as e:
        logger.error(f"Failed to get lyrics for {browse_id}: {e}")
        return {"lyrics": "Lyrics not available for this track.", "source": "Fallback"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
