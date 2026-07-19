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
        
        try:
            results = yt.search(q, filter=yt_filter)
        except Exception as parse_err:
            # Unfiltered search can fail due to top-result card parsing issues;
            # fall back to songs filter for reliability
            logger.warning(f"Unfiltered search failed, retrying with songs filter: {parse_err}")
            results = yt.search(q, filter="songs")
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
def get_lyrics(
    browse_id: str,
    title: str = Query(None),
    artist: str = Query(None),
    duration: float = Query(None)
):
    if not yt:
        raise HTTPException(status_code=500, detail="YTMusic client not initialized")
    
    import urllib.request, json as json_mod, urllib.parse
    
    # 1. Try lrclib.net for synced (timestamped) lyrics first
    if title and artist:
        try:
            params = urllib.parse.urlencode({
                "track_name": title,
                "artist_name": artist,
                **({"duration": int(duration)} if duration else {})
            })
            lrclib_url = f"https://lrclib.net/api/get?{params}"
            req = urllib.request.Request(lrclib_url, headers={"User-Agent": "AeroMusic/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                lrc_data = json_mod.loads(resp.read().decode())
                synced = lrc_data.get("syncedLyrics") or ""
                plain = lrc_data.get("plainLyrics") or ""
                if synced:
                    logger.info(f"lrclib.net synced lyrics found for '{title}'")
                    return {"lyrics": synced, "source": "lrclib.net", "synced": True}
                if plain:
                    logger.info(f"lrclib.net plain lyrics found for '{title}'")
                    return {"lyrics": plain, "source": "lrclib.net", "synced": False}
        except Exception as lrc_err:
            logger.warning(f"lrclib.net lookup failed for '{title}': {lrc_err}")
    
    # 2. Fall back to YouTube Music lyrics
    try:
        logger.info(f"Fetching YTMusic lyrics for browse_id={browse_id}")
        lyrics_data = yt.get_lyrics(browse_id)
        if lyrics_data and lyrics_data.get("lyrics"):
            return {**lyrics_data, "source": "ytmusic", "synced": False}
        return {"lyrics": "Lyrics not available for this track.", "source": "Fallback"}
    except Exception as e:
        logger.error(f"Failed to get lyrics for {browse_id}: {e}")
        return {"lyrics": "Lyrics not available for this track.", "source": "Fallback"}

@app.get("/api/suggestions")
def get_suggestions(q: str = Query(..., description="Query for suggestions")):
    if not yt:
        raise HTTPException(status_code=500, detail="YTMusic client not initialized")
    try:
        logger.info(f"Fetching suggestions for query '{q}'")
        suggestions = yt.get_search_suggestions(q)
        return suggestions
    except Exception as e:
        logger.error(f"Failed to get suggestions: {e}")
        return []

@app.get("/api/trending")
def get_trending(country: str = Query(None), country_name: str = Query(None)):
    if not yt:
        raise HTTPException(status_code=500, detail="YTMusic client not initialized")
    
    import urllib.request, json as json_mod

    # Detect location server-side if not provided
    location_label = "Your Area"
    if not country:
        try:
            req = urllib.request.Request(
                "https://ipapi.co/json/",
                headers={"User-Agent": "AeroMusic/1.0"}
            )
            with urllib.request.urlopen(req, timeout=4) as resp:
                geo = json_mod.loads(resp.read().decode())
                country = geo.get("country", "US")
                country_name = geo.get("country_name", "United States")
                city = geo.get("city", "")
                location_label = f"{city}, {country_name}" if city else country_name
        except Exception as geo_err:
            logger.warning(f"Server-side geo detection failed: {geo_err}")
            country = "US"
            country_name = "United States"
            location_label = "United States"
    else:
        location_label = country_name or country

    try:
        logger.info(f"Fetching trending for country={country}, country_name={country_name}")
        results = []

        if country:
            try:
                charts = yt.get_charts(country=country.upper())
                if charts and "songs" in charts and "items" in charts["songs"]:
                    results = charts["songs"]["items"]
            except Exception as charts_err:
                logger.warning(f"Failed to get native charts for {country}: {charts_err}")

        if not results:
            search_query = "trending songs"
            if country_name:
                search_query += f" {country_name}"
            elif country:
                search_query += f" {country}"
            logger.info(f"Using search fallback for trending: '{search_query}'")
            results = yt.search(search_query, filter="songs")

        return {"location": location_label, "tracks": results}
    except Exception as e:
        logger.error(f"Failed to get trending: {e}")
        try:
            fallback = yt.search("trending songs", filter="songs")
            return {"location": location_label, "tracks": fallback}
        except Exception:
            raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
