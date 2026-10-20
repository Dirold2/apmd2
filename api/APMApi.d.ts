import { HyperClient } from "hyperttp";
import type { AppleMusicAlbum, AppleMusicPlaylist, AppleMusicSearchOptions, AppleMusicSearchResults, AppleMusicTrack, ImportAppleMusicPlaylistOptions } from "../types/index.js";
/**
 * Client for importing public Apple Music playlists without a developer token.
 * It uses Apple's server-rendered HTML, not the official Apple Music API.
 */
export declare class APMApi {
    private readonly http;
    private readonly playlistCache;
    private readonly inflight;
    private readonly albumCache;
    private readonly albumInflight;
    private readonly trackCache;
    private readonly trackInflight;
    private readonly searchCache;
    private readonly searchInflight;
    constructor(httpClient?: HyperClient);
    /**
     * Fetches and parses a public playlist. Requests without an AbortSignal share
     * in-flight work and use a short-lived cache.
     */
    getPlaylist(playlistUrl: string, options?: Omit<ImportAppleMusicPlaylistOptions, "client">): Promise<AppleMusicPlaylist>;
    /** Fetches and parses a public Apple Music album. */
    getAlbum(albumUrl: string, options?: Omit<ImportAppleMusicPlaylistOptions, "client">): Promise<AppleMusicAlbum>;
    /** Fetches and parses a public Apple Music track. */
    getTrack(trackUrl: string, options?: Omit<ImportAppleMusicPlaylistOptions, "client">): Promise<AppleMusicTrack>;
    /** Searches the selected Apple Music storefront for tracks and artists. */
    search(query: string, options?: AppleMusicSearchOptions): Promise<AppleMusicSearchResults>;
    private requestPlaylist;
    private requestAlbum;
    private requestTrack;
    private requestSearch;
    private dedupe;
    private dedupeAlbum;
    private dedupeTrack;
    private dedupeSearch;
}
/** Backward-compatible functional shortcut for a one-off playlist import. */
export declare function importAppleMusicPlaylist(playlistUrl: string, options?: ImportAppleMusicPlaylistOptions): Promise<AppleMusicPlaylist>;
export default APMApi;
//# sourceMappingURL=APMApi.d.ts.map