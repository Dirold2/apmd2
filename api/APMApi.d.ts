import { HyperClient } from "hyperttp";
import type { AppleMusicAlbum, AppleMusicDailyCharts, AppleMusicDailyChartsOptions, AppleMusicNewReleases, AppleMusicNewReleasesOptions, AppleMusicPlaylist, AppleMusicSearchOptions, AppleMusicSearchResults, AppleMusicTrack, ImportAppleMusicPlaylistOptions } from "../types/index.js";
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
    private readonly dailyChartsCache;
    private readonly dailyChartsInflight;
    private readonly newReleasesCache;
    private readonly newReleasesInflight;
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
    /** Lists the daily Top 100 playlists rendered in Apple's chart catalogue. */
    getDailyCharts(options?: AppleMusicDailyChartsOptions): Promise<AppleMusicDailyCharts>;
    /** Lists album cards from Apple's New This Week room with one page request. */
    getNewReleases(options?: AppleMusicNewReleasesOptions): Promise<AppleMusicNewReleases>;
    /** Fetches the current Global Top 100 playlist discovered in the daily chart catalogue. */
    getDailyGlobalTopChart(options?: AppleMusicDailyChartsOptions): Promise<AppleMusicPlaylist>;
    /** Fetches the current Russia Top 100 playlist discovered in the daily chart catalogue. */
    getDailyRussiaTopChart(options?: AppleMusicDailyChartsOptions): Promise<AppleMusicPlaylist>;
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