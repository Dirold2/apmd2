import type { HyperClient } from "hyperttp";
/** A track extracted from a public Apple Music playlist page. */
export interface Track {
    /** One-based position in the playlist. */
    position: number;
    title: string;
    artist: string;
    album?: string;
    durationMs?: number;
    cover?: string;
    /** Apple Music catalogue (Adam) identifier, when Apple exposes one. */
    appleId?: string;
}
export interface AppleMusicPlaylist {
    title?: string;
    tracks: Track[];
    sourceUrl: string;
}
export interface AppleMusicDailyChart {
    title: string;
    url: string;
}
export interface AppleMusicDailyCharts {
    sourceUrl: string;
    charts: AppleMusicDailyChart[];
}
export interface AppleMusicDailyChartsOptions {
    /** Storefront used to view the chart catalogue. Defaults to `us`. */
    storefront?: string;
    signal?: AbortSignal;
}
/** Album card rendered in the New This Week catalogue, not a full album. */
export interface AppleMusicNewRelease {
    appleId: string;
    title: string;
    artists: string[];
    url: string;
    cover?: string;
}
export interface AppleMusicNewReleases {
    sourceUrl: string;
    albums: AppleMusicNewRelease[];
}
export interface AppleMusicNewReleasesOptions {
    /** Storefront used to view the room. Defaults to `uz`. */
    storefront?: string;
    signal?: AbortSignal;
}
export interface AppleMusicAlbum {
    title: string;
    artists: string[];
    trackCount?: number;
    releaseYear?: number;
    appleId?: string;
    cover?: string;
    tracks: Track[];
    sourceUrl: string;
}
export interface AppleMusicTrack {
    title: string;
    artist: string;
    artists: string[];
    album?: string;
    releaseDate?: string;
    durationMs?: number;
    appleId: string;
    cover?: string;
    sourceUrl: string;
}
export interface AppleMusicSearchTrack {
    appleId: string;
    title: string;
    artist?: string;
    cover?: string;
    url: string;
}
export interface AppleMusicSearchArtist {
    appleId: string;
    name: string;
    url: string;
}
export interface AppleMusicSearchResults {
    query: string;
    storefront: string;
    tracks: AppleMusicSearchTrack[];
    artists: AppleMusicSearchArtist[];
}
export interface AppleMusicSearchOptions {
    /** Apple Music storefront code, for example `ru`, `us`, or `in`. */
    storefront?: string;
    /** Maximum number of tracks and artists returned per type. Defaults to 20. */
    limit?: number;
    signal?: AbortSignal;
}
export interface ImportAppleMusicPlaylistOptions {
    client?: HyperClient;
    signal?: AbortSignal;
}
//# sourceMappingURL=index.d.ts.map